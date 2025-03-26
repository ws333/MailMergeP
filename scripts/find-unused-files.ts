import * as fs from "fs";
import * as path from "path";

// Configuration
const rootDir = path.resolve(__dirname, "..");
const packagesDir = path.join(rootDir, "packages");
const ignorePatterns = [
    /node_modules/,
    /\.git/,
    /backup/,
    /dist/,
    /build/,
    /\.vscode/,
    /\.idea/,
    /\.DS_Store/,
    /\.test\.(ts|js|tsx|jsx)$/, // Ignore test files
    /\.spec\.(ts|js|tsx|jsx)$/, // Ignore spec files
    /__tests__\//, // Ignore files in __tests__ directories
    /__mocks__\//, // Ignore files in __mocks__ directories
];

// Files that should be considered entry points (won't be marked as unused even if not imported)
const entryPoints = new Set([
    // Main entry files
    "index.ts",
    "index.tsx",
    "index.js",
    "index.jsx",
    "main.ts",
    "main.js",
    // Package specific entry points
    "thunderbird-iframe-service.ts",
    "browser-iframe-service.ts",
    "iframe-service.ts",
    "background.js",
    // HTML entry points
    "index.html",
    "thunderbird-iframe-server.html",
]);

// Special case files that should never be considered unused
const specialCaseFiles = new Set([
    "background.ts",
    "declaration.d.ts",
    "global.d.ts",
    "manifest.json",
    "package.json",
    "styled.d.ts",
    "tsconfig.json",
    "vite.config.ts",
    "vite-env.d.ts",
]);

// Types indicating potential dependency relationships
interface FileInfo {
    path: string;
    relativePath: string; // Path relative to package root
    content: string;
    imports: string[];
    isEntryPoint: boolean;
    isSpecialCase: boolean;
    componentName?: string; // Store component name for React components
}

interface PackageInfo {
    name: string;
    path: string;
    files: FileInfo[];
    dependencies: Map<string, string[]>; // package name -> imported files
}

// Get all packages in the project
function getPackages(): string[] {
    return fs.readdirSync(packagesDir).filter((dir) => fs.statSync(path.join(packagesDir, dir)).isDirectory());
}

// Should we ignore this file/directory?
function shouldIgnore(filePath: string): boolean {
    return ignorePatterns.some((pattern) => pattern.test(filePath));
}

// Is this file an entry point?
function isEntryPoint(filePath: string): boolean {
    const fileName = path.basename(filePath);
    return entryPoints.has(fileName);
}

// Is this file a special case that should never be marked as unused?
function isSpecialCase(filePath: string): boolean {
    const fileName = path.basename(filePath);
    return specialCaseFiles.has(fileName);
}

// Extract component name from a React component file
function extractComponentName(filePath: string, content: string): string | undefined {
    const fileName = path.basename(filePath, path.extname(filePath));

    // Look for export default [ComponentName] pattern
    const exportDefaultMatch = /export\s+default\s+(\w+)/.exec(content);
    if (exportDefaultMatch) {
        return exportDefaultMatch[1];
    }

    // Look for function [ComponentName]( pattern
    const functionMatch = /function\s+(\w+)\s*\(/.exec(content);
    if (functionMatch) {
        return functionMatch[1];
    }

    // Look for const [ComponentName] = pattern
    const constMatch = /const\s+(\w+)\s*=/.exec(content);
    if (constMatch) {
        return constMatch[1];
    }

    // If we can't find a specific export, use the file name
    return fileName;
}

// Read all files in a package
function getAllFiles(packageDir: string): string[] {
    const results: string[] = [];

    function readDir(dir: string) {
        if (shouldIgnore(dir)) return;

        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (shouldIgnore(filePath)) continue;

            if (stat.isDirectory()) {
                readDir(filePath);
            } else {
                // Only consider code files
                if (/\.(tsx?|jsx?|css|scss|less|html)$/.test(file)) {
                    results.push(filePath);
                }
            }
        }
    }

    readDir(packageDir);
    return results;
}

// Extract imports from a file
function extractImports(fileContent: string, filePath: string): string[] {
    const imports: string[] = [];

    // Match different import patterns
    // 1. ES6 imports
    const es6ImportPattern = /import\s+(?:(?:{[^}]*}|\*\s+as\s+[^;]+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;

    while ((match = es6ImportPattern.exec(fileContent)) !== null) {
        imports.push(match[1]);
    }

    // 2. require statements
    const requirePattern = /require\(['"]([^'"]+)['"]\)/g;

    while ((match = requirePattern.exec(fileContent)) !== null) {
        imports.push(match[1]);
    }

    // 3. Dynamic imports
    const dynamicImportPattern = /import\(['"]([^'"]+)['"]\)/g;

    while ((match = dynamicImportPattern.exec(fileContent)) !== null) {
        imports.push(match[1]);
    }

    // 4. Find script tags in HTML files
    if (filePath.endsWith(".html")) {
        const scriptTagPattern = /<script\s+(?:[^>]*?src=["']([^"']+)["'][^>]*?)>/g;
        while ((match = scriptTagPattern.exec(fileContent)) !== null) {
            imports.push(match[1]);
        }
    }

    return imports;
}

// Extract named imports from a file (for component tracking)
function extractNamedImports(fileContent: string): Record<string, string> {
    const namedImports: Record<string, string> = {};

    // Extract named imports in the format: import { ComponentA, ComponentB } from './path'
    const namedImportPattern = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = namedImportPattern.exec(fileContent)) !== null) {
        const names = match[1].split(",").map((name) => {
            // Handle 'Component as Alias' syntax
            const asMatch = /(\w+)(?:\s+as\s+(\w+))?/.exec(name.trim());
            if (asMatch) {
                const [_, originalName, alias] = asMatch;
                return alias || originalName;
            }
            return name.trim();
        });

        const importPath = match[2];
        names.forEach((name) => {
            namedImports[name] = importPath;
        });
    }

    // Extract default imports in the format: import ComponentName from './path'
    const defaultImportPattern = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;

    while ((match = defaultImportPattern.exec(fileContent)) !== null) {
        namedImports[match[1]] = match[2];
    }

    return namedImports;
}

// Resolve an import to a file path
function resolveImport(importPath: string, fromFile: string, packageInfo: PackageInfo): string | null {
    // Handle relative imports
    if (importPath.startsWith(".")) {
        const baseDir = path.dirname(fromFile);
        const resolvedPath = path.resolve(baseDir, importPath);

        // If the import doesn't have an extension, try common extensions
        if (!path.extname(resolvedPath)) {
            for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
                const withExt = `${resolvedPath}${ext}`;
                if (fs.existsSync(withExt)) {
                    return withExt;
                }
            }

            // Try index files in directories
            for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
                const indexFile = path.join(resolvedPath, `index${ext}`);
                if (fs.existsSync(indexFile)) {
                    return indexFile;
                }
            }

            // Try CSS files for style imports
            for (const ext of [".css", ".scss", ".less"]) {
                const styleFile = `${resolvedPath}${ext}`;
                if (fs.existsSync(styleFile)) {
                    return styleFile;
                }
            }
        } else if (fs.existsSync(resolvedPath)) {
            return resolvedPath;
        }
    }

    // Handle package imports (e.g., @iases3/interface)
    if (importPath.startsWith("@iases3/")) {
        const packageName = importPath.split("/")[1];
        const packagePath = path.join(packagesDir, packageName);

        if (fs.existsSync(packagePath)) {
            try {
                // Try to read package.json to find main entry point
                const pkgJsonPath = path.join(packagePath, "package.json");
                if (fs.existsSync(pkgJsonPath)) {
                    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
                    if (pkgJson.main) {
                        const mainPath = path.join(packagePath, pkgJson.main);
                        if (fs.existsSync(mainPath)) {
                            return mainPath;
                        }
                    }
                }

                // Fall back to index files
                for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
                    const indexFile = path.join(packagePath, `index${ext}`);
                    if (fs.existsSync(indexFile)) {
                        return indexFile;
                    }
                }
            } catch (error) {
                console.error(`Error resolving package import ${importPath}:`, error);
            }
        }
    }

    return null;
}

// Find component usage in JSX code
function findComponentUsage(fileContent: string): Set<string> {
    const componentUsage = new Set<string>();

    // Look for <ComponentName usage patterns in JSX
    const componentPattern = /<([A-Z]\w+)(?:\s|\/?>|\/>)/g;
    let match;

    while ((match = componentPattern.exec(fileContent)) !== null) {
        componentUsage.add(match[1]);
    }

    // Also look for React components used in code
    const jsxComponentPattern = /\bimport\s+(?:{([^}]+)})?\s*(?:\w+\s+from\s+)?['"]([^'"]+)['"]/g;
    while ((match = jsxComponentPattern.exec(fileContent)) !== null) {
        if (match[1]) {
            // Extract individual component names from destructured import
            const componentNames = match[1].split(",").map((name) => name.trim());
            componentNames.forEach((name) => {
                // Handle cases like "Component as Alias"
                const asMatch = /(\w+)(?:\s+as\s+(\w+))?/.exec(name);
                if (asMatch) {
                    componentUsage.add(asMatch[2] || asMatch[1]);
                }
            });
        }
    }

    return componentUsage;
}

// Build a dependency graph for all files in all packages
function buildDependencyGraph(): {
    graph: Map<string, Set<string>>;
    componentNameToFile: Map<string, string>;
} {
    const graph = new Map<string, Set<string>>();
    const packages: PackageInfo[] = [];
    const componentNameToFile = new Map<string, string>(); // Map component names to their file paths
    const componentUsageByFile = new Map<string, Set<string>>(); // Track component usage in each file

    // First, gather all file info for each package
    for (const packageName of getPackages()) {
        const packagePath = path.join(packagesDir, packageName);
        const files = getAllFiles(packagePath).map((filePath) => {
            const content = fs.readFileSync(filePath, "utf8");
            const relativePath = path.relative(packagePath, filePath);
            const isReactComponent =
                /\.(tsx|jsx)$/.test(filePath) &&
                (content.includes("export default") || content.includes("function ") || content.includes("const "));

            let componentName;
            if (isReactComponent) {
                componentName = extractComponentName(filePath, content);
                if (componentName) {
                    componentNameToFile.set(componentName, filePath);
                }
            }

            // Detect component usage for JSX files
            if (/\.(tsx|jsx)$/.test(filePath)) {
                componentUsageByFile.set(filePath, findComponentUsage(content));
            }

            return {
                path: filePath,
                relativePath,
                content,
                imports: extractImports(content, filePath),
                isEntryPoint: isEntryPoint(filePath),
                isSpecialCase: isSpecialCase(filePath),
                componentName,
            };
        });

        packages.push({
            name: packageName,
            path: packagePath,
            files,
            dependencies: new Map(),
        });

        // Initialize graph with all files
        for (const file of files) {
            graph.set(file.path, new Set<string>());
        }
    }

    // Now resolve imports and build the graph
    for (const pkg of packages) {
        for (const file of pkg.files) {
            // Process normal imports
            for (const importPath of file.imports) {
                const resolvedImport = resolveImport(importPath, file.path, pkg);

                if (resolvedImport) {
                    // Add an edge in our dependency graph
                    const dependents = graph.get(resolvedImport) || new Set<string>();
                    dependents.add(file.path);
                    graph.set(resolvedImport, dependents);
                }
            }

            // Process component imports/usage
            const componentUsage = componentUsageByFile.get(file.path);
            if (componentUsage) {
                for (const usedComponent of componentUsage) {
                    const componentFile = componentNameToFile.get(usedComponent);
                    if (componentFile && componentFile !== file.path) {
                        // Add component usage as an edge in our graph
                        const dependents = graph.get(componentFile) || new Set<string>();
                        dependents.add(file.path);
                        graph.set(componentFile, dependents);
                    }
                }
            }

            // Also process named imports
            const namedImports = extractNamedImports(file.content);
            for (const [importName, importPath] of Object.entries(namedImports)) {
                const componentFile = componentNameToFile.get(importName);
                if (componentFile) {
                    // Add an edge in our dependency graph
                    const dependents = graph.get(componentFile) || new Set<string>();
                    dependents.add(file.path);
                    graph.set(componentFile, dependents);
                } else {
                    // Try to resolve the import path to a file
                    const resolvedImport = resolveImport(importPath, file.path, pkg);
                    if (resolvedImport) {
                        // Add an edge in our dependency graph
                        const dependents = graph.get(resolvedImport) || new Set<string>();
                        dependents.add(file.path);
                        graph.set(resolvedImport, dependents);
                    }
                }
            }
        }
    }

    return { graph, componentNameToFile };
}

// Find files that are not imported anywhere
function findUnusedFiles(graph: Map<string, Set<string>>): string[] {
    const unusedFiles: string[] = [];

    for (const [filePath, dependents] of graph.entries()) {
        // Check if this file has no dependents and is not an entry point or special case
        if (dependents.size === 0 && !isEntryPoint(filePath) && !isSpecialCase(filePath)) {
            unusedFiles.push(filePath);
        }
    }

    return unusedFiles;
}

// Analyze commented-out imports
function analyzeCommentedImports(): void {
    const commentedImports: Record<string, string[]> = {};

    for (const packageName of getPackages()) {
        const packagePath = path.join(packagesDir, packageName);
        const files = getAllFiles(packagePath);

        for (const filePath of files) {
            const content = fs.readFileSync(filePath, "utf8");
            const relativePath = path.relative(rootDir, filePath);

            // Look for commented imports
            const commentedImportRegex = /\/\/\s*import\s+(?:{[^}]*}|\*\s+as\s+[^;]+\s+from\s+)?['"]([^'"]+)['"]/g;
            let match;
            const imports: string[] = [];

            while ((match = commentedImportRegex.exec(content)) !== null) {
                imports.push(match[1]);
            }

            if (imports.length > 0) {
                commentedImports[relativePath] = imports;
            }
        }
    }

    if (Object.keys(commentedImports).length > 0) {
        console.log("\nFiles with commented-out imports:");
        for (const [file, imports] of Object.entries(commentedImports)) {
            console.log(`- ${file}`);
            imports.forEach((imp) => console.log(`  - ${imp}`));
        }
    }
}

// Find potentially duplicated functionality
function findPotentialDuplicates(): void {
    const serviceFiles = [
        path.join(packagesDir, "browser-preview/src/browser-iframe-service.ts"),
        path.join(packagesDir, "thunderbird-iframe-service/src/thunderbird-iframe-service.ts"),
        path.join(packagesDir, "iframe-service/src/iframe-service.ts"),
    ];

    console.log("\nPotential functionality duplication in service files:");

    // Find common function names across files
    const functionsByFile: Record<string, string[]> = {};

    for (const filePath of serviceFiles) {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, "utf8");
            const relativePath = path.relative(rootDir, filePath);

            // Extract function declarations
            const functionRegex = /function\s+([a-zA-Z0-9_]+)\s*\(/g;
            let match;
            const functions: string[] = [];

            while ((match = functionRegex.exec(content)) !== null) {
                functions.push(match[1]);
            }

            functionsByFile[relativePath] = functions;
        }
    }

    // Find common functions
    const allFunctions = Object.values(functionsByFile).flat();
    const functionCounts = allFunctions.reduce(
        (acc, func) => {
            acc[func] = (acc[func] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    const duplicatedFunctions = Object.entries(functionCounts)
        .filter(([_, count]) => count > 1)
        .map(([func]) => func);

    if (duplicatedFunctions.length > 0) {
        console.log("Common functions across service files:");
        duplicatedFunctions.forEach((func) => {
            console.log(`- ${func} appears in multiple files`);

            // Show which files contain this function
            Object.entries(functionsByFile).forEach(([file, functions]) => {
                if (functions.includes(func)) {
                    console.log(`  - ${file}`);
                }
            });
        });
    }
}

// Visualize component usage to help debug the dependency graph
function visualizeComponentUsage(componentNameToFile: Map<string, string>, graph: Map<string, Set<string>>): void {
    console.log("\nComponent usage in the project:");

    for (const [componentName, filePath] of componentNameToFile.entries()) {
        const dependents = graph.get(filePath) || new Set<string>();

        // Only show components that are actually used
        if (dependents.size > 0) {
            console.log(`- ${componentName} (${path.relative(rootDir, filePath)}) is used in:`);
            dependents.forEach((dependentPath) => {
                console.log(`  - ${path.relative(rootDir, dependentPath)}`);
            });
        }
    }
}

// Display usage of specific components for debugging
function debugComponentUsage(
    componentNames: string[],
    componentNameToFile: Map<string, string>,
    graph: Map<string, Set<string>>
): void {
    console.log("\nDebugging specific component usage:");

    for (const componentName of componentNames) {
        const filePath = componentNameToFile.get(componentName);
        if (filePath) {
            const dependents = graph.get(filePath) || new Set<string>();
            console.log(
                `- ${componentName} (${path.relative(rootDir, filePath)}) is used in ${dependents.size} file(s):`
            );
            dependents.forEach((dependentPath) => {
                console.log(`  - ${path.relative(rootDir, dependentPath)}`);
            });
        } else {
            console.log(`- ${componentName} not found in the project`);
        }
    }
}

// Main function
async function main() {
    console.log("Analyzing project for unused files...");

    // Build dependency graph
    const { graph, componentNameToFile } = buildDependencyGraph();

    // Find unused files
    const unusedFiles = findUnusedFiles(graph);

    console.log("\nUnused files (not imported anywhere):");
    unusedFiles.forEach((file) => {
        console.log(`- ${path.relative(rootDir, file)}`);
    });

    // Debug specific components that were previously showing as unused
    debugComponentUsage(["ButtonCancel", "ButtonEndSession", "ButtonSendEmails"], componentNameToFile, graph);

    // Additional analysis
    analyzeCommentedImports();
    findPotentialDuplicates();

    console.log("\nAnalysis complete.");
}

main().catch(console.error);
