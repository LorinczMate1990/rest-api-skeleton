#!/bin/bash

tsc --esModuleInterop -t es5 tests/unit/unittest.ts && npx mocha tests/unit/unittest.js