# You cannot directly run this script now; I'm still working on it.
# But you can use it as a reference to build clangd for wasm32-wasi.

# 0. Dependencies

## Note: Better to make sure WASI SDK version matches the LLVM version
EMSDK_VER=3.1.52
WASI_SDK_VER=21.0
WASI_SDK_VER_MAJOR=21
LLVM_VER=17.0.6
LLVM_VER_MAJOR=17

sudo apt install vim git build-essential cmake ninja-build python3

WORKSPACE_DIR=$PWD
ROOT_DIR=$(mktemp -d)
cd $ROOT_DIR

# 1. Get Emscripten

git clone --branch $EMSDK_VER --depth 1 https://github.com/emscripten-core/emsdk
pushd emsdk
./emsdk install $EMSDK_VER
./emsdk activate $EMSDK_VER
source ./emsdk_env.sh
popd

# 2. Prepare WASI sysroot

wget -O- https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-$WASI_SDK_VER_MAJOR/wasi-sysroot-$WASI_SDK_VER.tar.gz | tar -xz

# 3. Build LLVM

git clone --branch llvmorg-$LLVM_VER --depth 1 https://github.com/llvm/llvm-project
cd llvm-project

## Build native tools first
cmake -G Ninja -S llvm -B build-native \
    -DCMAKE_BUILD_TYPE=Release \
    -DLLVM_ENABLE_PROJECTS=clang
cmake --build build-native --target llvm-tblgen clang-tblgen clangd

## Apply a patch for blocking stdin read
git apply $WORKSPACE_DIR/wait_stdin.patch

## Build clangd (1st time, just for compiler headers)
emcmake cmake -G Ninja -S llvm -B build \
    -DCMAKE_CXX_FLAGS="-pthread -Dwait4=__syscall_wait4" \
    -DCMAKE_EXE_LINKER_FLAGS="-pthread -s ENVIRONMENT=worker -s NO_INVOKE_RUN" \
    -DCMAKE_BUILD_TYPE=MinSizeRel \
    -DLLVM_TARGET_ARCH=wasm32-emscripten \
    -DLLVM_DEFAULT_TARGET_TRIPLE=wasm32-wasi \
    -DLLVM_TARGETS_TO_BUILD=WebAssembly \
    -DLLVM_ENABLE_PROJECTS="clang;clang-tools-extra" \
    -DLLVM_TABLEGEN=$PWD/build-native/bin/llvm-tblgen \
    -DCLANG_TABLEGEN=$PWD/build-native/bin/clang-tblgen \
    -DLLVM_BUILD_STATIC=ON \
    -DLLVM_INCLUDE_EXAMPLES=OFF \
    -DLLVM_INCLUDE_TESTS=OFF \
    -DLLVM_ENABLE_BACKTRACES=OFF \
    -DLLVM_ENABLE_UNWIND_TABLES=OFF \
    -DLLVM_ENABLE_CRASH_OVERRIDES=OFF \
    -DCLANG_ENABLE_STATIC_ANALYZER=OFF \
    -DLLVM_ENABLE_TERMINFO=OFF \
    -DLLVM_ENABLE_PIC=OFF \
    -DLLVM_ENABLE_ZLIB=OFF \
    -DCLANG_ENABLE_ARCMT=OFF
cmake --build build --target clangd

## Copy installed headers to WASI sysroot
cp -r build/lib/clang/$LLVM_VER_MAJOR/include/* $ROOT_DIR/wasi-sysroot/include/

## Build clangd (2nd time, for the real thing)
emcmake cmake -G Ninja -S llvm -B build \
    -DCMAKE_CXX_FLAGS="-pthread -Dwait4=__syscall_wait4" \
    -DCMAKE_EXE_LINKER_FLAGS="-pthread -s ENVIRONMENT=worker -s NO_INVOKE_RUN -s EXIT_RUNTIME -s INITIAL_MEMORY=2GB -s STACK_SIZE=256kB -s EXPORTED_RUNTIME_METHODS=FS,callMain -s MODULARIZE -s EXPORT_ES6 -s WASM_BIGINT -s ASSERTIONS -s ASYNCIFY -s PTHREAD_POOL_SIZE='Math.max(navigator.hardwareConcurrency, 8)' --preload-file=$ROOT_DIR/wasi-sysroot/include@/usr/include" \
    -DCMAKE_BUILD_TYPE=MinSizeRel \
    -DLLVM_TARGET_ARCH=wasm32-emscripten \
    -DLLVM_DEFAULT_TARGET_TRIPLE=wasm32-wasi \
    -DLLVM_TARGETS_TO_BUILD=WebAssembly \
    -DLLVM_ENABLE_PROJECTS="clang;clang-tools-extra" \
    -DLLVM_TABLEGEN=$PWD/build-native/bin/llvm-tblgen \
    -DCLANG_TABLEGEN=$PWD/build-native/bin/clang-tblgen \
    -DLLVM_BUILD_STATIC=ON \
    -DLLVM_INCLUDE_EXAMPLES=OFF \
    -DLLVM_INCLUDE_TESTS=OFF \
    -DLLVM_ENABLE_BACKTRACES=OFF \
    -DLLVM_ENABLE_UNWIND_TABLES=OFF \
    -DLLVM_ENABLE_CRASH_OVERRIDES=OFF \
    -DCLANG_ENABLE_STATIC_ANALYZER=OFF \
    -DLLVM_ENABLE_TERMINFO=OFF \
    -DLLVM_ENABLE_PIC=OFF \
    -DLLVM_ENABLE_ZLIB=OFF \
    -DCLANG_ENABLE_ARCMT=OFF
cmake --build build --target clangd

# 4. Copy the final binary
cp build/bin/clangd* $WORKSPACE_DIR/public/wasm/
