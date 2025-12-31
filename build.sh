#!/usr/bin/env bash
# It's not recommend for you to run this script directly,
# (because I'm not good at writing this sorry)
# but you can use it as a reference for building.

# 0. Configs

# sudo apt install vim git build-essential cmake ninja-build python3
set -e

## Note: Better to make sure WASI SDK version matches the LLVM version
EMSDK_VER=4.0.22
WASI_SDK_VER=29.0
WASI_SDK_VER_MAJOR=29
LLVM_VER=21.1.0
LLVM_VER_MAJOR=21

WORKSPACE_DIR=$PWD
ROOT_DIR=${ROOT_DIR:-$(mktemp -d)}
cd $ROOT_DIR
echo "Working directory: $ROOT_DIR"

# 1. Get Emscripten

if [[ -d emsdk ]]; then
    echo "Emscripten SDK already exists, skipping clone."
else
    git clone --branch $EMSDK_VER --depth 1 https://github.com/emscripten-core/emsdk
fi
pushd emsdk
./emsdk install $EMSDK_VER
./emsdk activate $EMSDK_VER
source ./emsdk_env.sh
popd

# 2. Prepare WASI sysroot

if [[ -d wasi-sysroot-$WASI_SDK_VER ]]; then
    echo "WASI sysroot already exists, skipping download."
else
    wget -O- https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-$WASI_SDK_VER_MAJOR/wasi-sysroot-$WASI_SDK_VER.tar.gz | tar -xz
fi
WASI_SYSROOT_DIR=$ROOT_DIR/wasi-sysroot-$WASI_SDK_VER

# 3. Build LLVM

if [[ -d llvm-project ]]; then
    echo "LLVM project already exists, skipping clone."
else
    git clone --branch llvmorg-$LLVM_VER --depth 1 https://github.com/llvm/llvm-project
fi

cd llvm-project

## Build native tools first
cmake -G Ninja -S llvm -B build-native \
    -DCMAKE_BUILD_TYPE=Release \
    -DLLVM_ENABLE_PROJECTS=clang
cmake --build build-native --target llvm-tblgen clang-tblgen

## Apply a patch for blocking stdin read
if [[ -f $ROOT_DIR/llvm-project/.patched-wait-stdin ]]; then
    echo "Patch for wait_stdin already applied, skipping."
else
    git apply $WORKSPACE_DIR/wait_stdin.patch && touch $ROOT_DIR/llvm-project/.patched-wait-stdin
fi

## Build a cross-compiling clang (host: <build>, target: wasm32-wasi), for headers and modules
cmake -G Ninja -S llvm -B build-cross \
    -DCMAKE_BUILD_TYPE=Release \
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
cmake --build build-cross --target clang

## Precompile C++ standard library modules
PREBUILT_MODULE_PATH=$ROOT_DIR/prebuilt_modules
mkdir -p $PREBUILT_MODULE_PATH
build-cross/bin/clang++ --sysroot=$WASI_SYSROOT_DIR -mllvm -wasm-enable-sjlj -D_WASI_EMULATED_SIGNAL -std=c++2c -Wno-reserved-module-identifier -fprebuilt-module-path=$PREBUILT_MODULE_PATH --precompile $WASI_SYSROOT_DIR/share/libc++/v1/std.cppm -o $PREBUILT_MODULE_PATH/std.pcm
build-cross/bin/clang++ --sysroot=$WASI_SYSROOT_DIR -mllvm -wasm-enable-sjlj -D_WASI_EMULATED_SIGNAL -std=c++2c -Wno-reserved-module-identifier -fprebuilt-module-path=$PREBUILT_MODULE_PATH --precompile $WASI_SYSROOT_DIR/share/libc++/v1/std.compat.cppm -o $PREBUILT_MODULE_PATH/std.compat.pcm
cp -r $PREBUILT_MODULE_PATH $WASI_SYSROOT_DIR/modules/

## Copy installed headers to WASI sysroot
cp -r build-cross/lib/clang/$LLVM_VER_MAJOR/include/* $WASI_SYSROOT_DIR/include/

## Build clangd (2nd time, for the real thing)
emcmake cmake -G Ninja -S llvm -B build \
    -DCMAKE_CXX_FLAGS="-pthread -Dwait4=__syscall_wait4" \
    -DCMAKE_EXE_LINKER_FLAGS="-pthread -s ENVIRONMENT=worker -s NO_INVOKE_RUN -s EXIT_RUNTIME -s INITIAL_MEMORY=2GB -s ALLOW_MEMORY_GROWTH -s MAXIMUM_MEMORY=4GB -s STACK_SIZE=256kB -s EXPORTED_RUNTIME_METHODS=FS,callMain -s MODULARIZE -s EXPORT_ES6 -s WASM_BIGINT -s ASSERTIONS -s ASYNCIFY -s PTHREAD_POOL_SIZE='Math.max(navigator.hardwareConcurrency, 8)' --embed-file=$WASI_SYSROOT_DIR/include@/usr/include --embed-file=$PREBUILT_MODULE_PATH@/modules" \
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
