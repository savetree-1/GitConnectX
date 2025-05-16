#!/usr/bin/env python
# compile_algorithms.py - Compile C++ algorithm implementations

import os
import subprocess
import logging
import platform
import sys
import shutil
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Define C++ source files and their output binaries
ALGORITHMS = [
    {'source': 'cpp_algorithms/pagerank.cpp', 'output': 'cpp_algorithms/pagerank', 'deps': ['graph.h']},
    {'source': 'cpp_algorithms/louvain.cpp', 'output': 'cpp_algorithms/louvain', 'deps': ['graph.h']},
    {'source': 'cpp_algorithms/dijkstra.cpp', 'output': 'cpp_algorithms/dijkstra', 'deps': ['graph.h']},
    {'source': 'cpp_algorithms/hits.cpp', 'output': 'cpp_algorithms/hits', 'deps': ['graph.h']},
    {'source': 'cpp_algorithms/bfs_dfs.cpp', 'output': 'cpp_algorithms/bfs_dfs', 'deps': ['graph.h']},
    {'source': 'cpp_algorithms/kcore.cpp', 'output': 'cpp_algorithms/kcore', 'deps': ['graph.h']}
]

def check_compiler() -> Optional[str]:
    """Check if a C++ compiler is available and return its path."""
    compilers = ['g++', 'clang++']
    if platform.system() == 'Windows':
        compilers.insert(0, 'cl')  # Add MSVC compiler on Windows
    
    for compiler in compilers:
        try:
            result = subprocess.run(
                [compiler, '--version'],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            logger.info(f"Found compiler: {compiler}")
            logger.info(f"Version info: {result.stdout.splitlines()[0]}")
            return compiler
        except (subprocess.SubprocessError, FileNotFoundError):
            continue
    
    logger.error("No C++ compiler found. Please install a C++ compiler (g++, clang++, or MSVC).")
    return None

def get_compiler_flags(compiler: str) -> List[str]:
    """Get appropriate compiler flags based on the compiler and platform."""
    if compiler == 'cl':  # MSVC
        return ['/std:c++17', '/O2', '/EHsc', '/W4']
    else:  # GCC/Clang
        return ['-std=c++17', '-O3', '-Wall', '-Wextra', '-pedantic']

def check_dependencies(algorithm: Dict[str, str], cpp_dir: str) -> bool:
    """Check if all dependencies for an algorithm exist."""
    for dep in algorithm.get('deps', []):
        dep_path = os.path.join(cpp_dir, dep)
        if not os.path.exists(dep_path):
            logger.error(f"Missing dependency: {dep_path}")
            return False
    return True

def create_build_directory(cpp_dir: str) -> str:
    """Create and return the build directory path."""
    build_dir = os.path.join(cpp_dir, 'build')
    os.makedirs(build_dir, exist_ok=True)
    return build_dir

def compile_algorithm(algorithm: Dict[str, str], compiler: str, flags: List[str], build_dir: str) -> bool:
    """Compile a single algorithm."""
    source_file = algorithm['source']
    output_name = os.path.splitext(os.path.basename(algorithm['output']))[0]
    output_file = os.path.join(build_dir, output_name)
    
    if platform.system() == 'Windows':
        output_file += '.exe'
    
    try:
        cmd = [compiler] + flags + ['-o', output_file, source_file]
        logger.info(f"Compiling: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        if result.stdout:
            logger.info(result.stdout)
        if result.stderr:
            logger.warning(result.stderr)
        
        # Copy the executable to the original output location
        os.makedirs(os.path.dirname(algorithm['output']), exist_ok=True)
        shutil.copy2(output_file, algorithm['output'])
        
        logger.info(f"Successfully compiled: {algorithm['output']}")
        return True
    
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to compile {source_file}:")
        if e.stdout:
            logger.error(f"Compiler output:\n{e.stdout}")
        if e.stderr:
            logger.error(f"Compiler errors:\n{e.stderr}")
        return False
    except Exception as e:
        logger.error(f"Error compiling {source_file}: {str(e)}")
        return False

def main():
    """Compile C++ algorithm implementations"""
    cpp_dir = 'cpp_algorithms'
    os.makedirs(cpp_dir, exist_ok=True)
    
    # Check for compiler
    compiler = check_compiler()
    if not compiler:
        sys.exit(1)
    
    # Get compiler flags
    flags = get_compiler_flags(compiler)
    
    # Create build directory
    build_dir = create_build_directory(cpp_dir)
    
    # Track compilation success
    success_count = 0
    fail_count = 0
    
    # Compile each algorithm
    for algorithm in ALGORITHMS:
        source_file = algorithm['source']
        
        # Check if source file exists
        if not os.path.exists(source_file):
            logger.error(f"Source file not found: {source_file}")
            fail_count += 1
            continue
        
        # Check dependencies
        if not check_dependencies(algorithm, cpp_dir):
            fail_count += 1
            continue
        
        # Compile the algorithm
        if compile_algorithm(algorithm, compiler, flags, build_dir):
            success_count += 1
        else:
            fail_count += 1
    
    # Print summary
    total = success_count + fail_count
    logger.info("\nCompilation Summary:")
    logger.info(f"Total algorithms: {total}")
    logger.info(f"Successfully compiled: {success_count}")
    logger.info(f"Failed to compile: {fail_count}")
    
    if fail_count > 0:
        sys.exit(1)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\nCompilation interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        sys.exit(1) 