import sys
import os
print(f"Python Executable: {sys.executable}")
print(f"CWD: {os.getcwd()}")
try:
    import pip
    print("pip is importable")
except ImportError:
    print("pip is NOT importable")
try:
    import pysqlite3
    print("pysqlite3 is installed")
except ImportError:
    print("pysqlite3 is NOT installed")
