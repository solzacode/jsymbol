# jsymbol

[![Build Status](https://travis-ci.org/solzacode/jsymbol.svg?branch=master)](https://travis-ci.org/solzacode/jsymbol)
[![NPM version](https://badge.fury.io/js/jsymbol.svg)](https://www.npmjs.com/package/jsymbol)
[![Coverage Status](https://coveralls.io/repos/github/solzacode/jsymbol/badge.svg?branch=master)](https://coveralls.io/github/solzacode/jsymbol?branch=master)

Data structures for symbols and symbol table to be used in compilers/interpreters. Written in TypeScript and can be used in TypeScript and JavaScript projects.

## Installation

### Using yarn

```sh
yarn add jsymbol
```

### Using npm

```sh
npm install jsymbol --save
```

## Usage

### TypeScript

```typescript
import { SymbolTable, AstSymbol } from "jsymbol";

let st: SymbolTable<AstSymbol> = new SymbolTable<AstSymbol>(s => s.identifier);
let sym: AstSymbol = new AstSymbol("counter", "variable");   // symbol and its type

st.add(sym);

st.enterScope();
// assert: st.lookup("counter") === sym;

st.exitScope();
```

### JavaScript

```javascript
const jsymbol = require("jsymbol");

let st = new jsymbol.SymbolTable(s => s.identifier);
let sym = new jsymbol.AstSymbol("counter", "variable");

st.add(sym);

st.enterScope();
// assert: st.lookup("counter") === sym;

st.exitScope();
```
