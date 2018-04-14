import { SymbolTable, AstSymbol } from "../src/index";

enum MySymbolType {
    Class,
    Interface
}

class MySymbol implements AstSymbol<MySymbolType> {
    state: boolean;

    constructor(public identifier: string, type: MySymbolType) {
        this.state = false;
    }
}

describe("Symbol table tests", () => {
    let s: SymbolTable;

    beforeEach(() => {
        s = new SymbolTable();
    });

    it("adds a new symbol", () => {
        s.add("someVariable");
        expect(true).toBe(true);
    });

    it("doesn't allow adding duplicate variables", () => {
        expect(() => {
            s.add("someVariable");
            s.add("someVariable");
        }).toThrow("Symbol someVariable already found in desired scope");
    });

    it("allows adding same symbol in different scopes", () => {
        s.add("someVariable");
        s.enterScope();
        s.add("someVariable");
        expect(true).toBe(true);
    });

    it("looks up symbol just added", () => {
        s.add("someVariable");
        expect(s.lookup("someVariable")).toEqual(["someVariable"]);
    });

    it("local lookup of symbol added in parent scope won't resolve", () => {
        s.add("someVariable");
        s.enterScope();

        expect(s.localLookup("someVariable")).toBeUndefined();

        s.exitScope();
        expect(s.localLookup("someVariable")).toEqual(["someVariable"]);
    });

    it("finds a symbol added in parent scope from a child scope", () => {
        s.add("someVariable");
        s.enterScope();

        expect(s.lookup("someVariable")).toEqual(["someVariable"]);
    });

    it("cannot find symbol added in child scope from parent scope", () => {
        s.enterScope();
        s.add("someVariable");
        expect(s.lookup("someVariable")).toEqual(["someVariable"]);

        s.exitScope();
        expect(s.lookup("someVariable")).toBeUndefined();
    });

    it("can add and lookup symbol using AstSymbol structure", () => {
        let sym: AstSymbol = { identifier: "someVariable" };
        let st: SymbolTable<AstSymbol> = new SymbolTable(symbol => symbol.identifier);

        st.add(sym);
        expect(st.lookup(sym)).toEqual([sym]);
        expect(st.lookup(sym)[0].identifier).toEqual("someVariable");
    });

    it("cannot exit from root scope", () => {
        expect(() => {
            s.exitScope();
        }).toThrow("Already at the root scope");
    });

    it("finds symbol from deep child scope", () => {
        s.add("s1");
        s.enterScope();
        s.add("s2");
        s.enterScope();

        expect(s.localLookup("s2")).toBeUndefined();
        expect(s.lookup("s2")).toEqual(["s2"]);
        expect(s.localLookup("s1")).toBeUndefined();
        expect(s.lookup("s1")).toEqual(["s1"]);
    });

    it("looks up AstSymbol from child scope", () => {
        let sym: AstSymbol = { identifier: "someVariable" };
        let st: SymbolTable<AstSymbol> = new SymbolTable<AstSymbol>(symbol => symbol.identifier);

        st.add(sym);
        expect(st.lookup(sym)).toEqual([sym]);
        expect(st.lookup(sym)[0].identifier).toBe("someVariable");

        st.enterScope();
        expect(st.localLookup(sym)).toBeUndefined();
        expect(st.lookup(sym)).toEqual([sym]);
    });

    it("add and lookup symbol with a key different from the symbol", () => {
        let sym: AstSymbol = { identifier: "someVariable" };
        let st: SymbolTable<AstSymbol> = new SymbolTable<AstSymbol>(symbol => symbol.identifier);

        st.add("s1", sym);
        expect(st.lookup("s1")).toEqual([sym]);
        expect(st.lookup(sym)).toBeUndefined();
    });

    it("add symbols to global scope from any scope and find them", () => {
        s.addToGlobalScope("s1");
        s.enterScope();
        s.addToGlobalScope("s2");

        expect(s.localLookup("s1")).toBeUndefined();
        expect(s.lookup("s1")).toEqual(["s1"]);
        expect(s.localLookup("s2")).toBeUndefined();
        expect(s.lookup("s2")).toEqual(["s2"]);
    });

    it ("can't add duplicate symbols to global scope from any scope", () => {
        s.enterScope();
        s.addToGlobalScope("s1");
        s.enterScope();

        expect(() => {
            s.addToGlobalScope("s1");
        }).toThrow("Symbol s1 already found in desired scope");
    });

    it ("looks up AstSymbol added to global scope", () => {
        let sym = { identifier: "someVar" };
        let st = new SymbolTable<AstSymbol>(symbol => symbol.identifier);

        st.addToGlobalScope(sym);
        st.enterScope();

        expect(st.lookup(sym)).toEqual([sym]);
        expect(st.lookup("someVar")).toEqual([sym]);
        expect(st.localLookup(sym)).toBeUndefined();
        expect(st.localLookup("someVar")).toBeUndefined();
    });

    it ("works with custom symbol types", () => {
        let sym = new MySymbol("string", MySymbolType.Class);
        let st = new SymbolTable<MySymbol>(symbol => symbol.identifier);

        st.add(sym);

        expect(st.lookup("string")).toEqual([sym]);
    });

    it ("exposes an iterator", () => {
        s.add("s1");
        s.add("s2");

        let symbols = [];
        for (let symbol of s) {
            symbols.push(symbol);
        }

        expect(symbols.length).toBe(2);
        expect(symbols.findIndex(v => v === "s1")).toBeGreaterThanOrEqual(0);
        expect(symbols.findIndex(v => v === "s2")).toBeGreaterThanOrEqual(0);
    });

    it("can iterate across scopes", () => {
        s.add("s1");
        s.enterScope();
        s.add("s2");
        s.enterScope();
        s.addToGlobalScope("s3");

        let symbols = [];
        for (let symbol of s) {
            symbols.push(symbol);
        }

        expect(symbols.length).toBe(3);
        expect(symbols.findIndex(v => v === "s1")).toBeGreaterThanOrEqual(0);
        expect(symbols.findIndex(v => v === "s2")).toBeGreaterThanOrEqual(0);
        expect(symbols.findIndex(v => v === "s3")).toBeGreaterThanOrEqual(0);
    });

    it("can add duplicate symbols with different types", () => {
        let sym1: AstSymbol = { identifier: "myVar", type: "var" };
        let sym2: AstSymbol = { identifier: "myVar", type: "func" };

        s.add(sym1);
        s.add(sym2);

        expect(s.lookup("myVar")).toEqual([sym1, sym2]);
    });

    it("can add duplicate symbols with different parents", () => {
        let sym1: AstSymbol = { identifier: "myVar" };
        let sym2: AstSymbol = { identifier: "myVar", parent: sym1 };

        s.add(sym1);
        s.add(sym2);

        expect(s.lookup("myVar")).toEqual([sym1, sym2]);
    });

    it("cannot add duplicate symbols with different types when allowDuplicates is set to false", () => {
        let st: SymbolTable = new SymbolTable();
        st.allowDuplicates = false;

        let sym1: AstSymbol = { identifier: "myVar", type: "var" };
        let sym2: AstSymbol = { identifier: "myVar", type: "func" };

        st.add(sym1);

        expect(() => {
            st.add(sym2);
        }).toThrow("Symbol myVar already found in desired scope");
    });

    it("looks up the right symbol based on type", () => {
        let sym1: AstSymbol = { identifier: "myVar", type: "var" };
        let sym2: AstSymbol = { identifier: "myVar", type: "func" };

        s.add(sym1);
        s.add(sym2);

        expect(s.lookup("myVar", "var")).toEqual([sym1]);
        expect(s.lookup("myVar", "func")).toEqual([sym2]);
    });

    it("looks up the right symbol based on parent", () => {
        let sym0: AstSymbol = { identifier: "myVar", type: "class" };
        let sym1: AstSymbol = { identifier: "myVar", type: "func", parent: sym0 };
        let sym2: AstSymbol = { identifier: "myVar", type: "var", parent: sym1 };

        s.add(sym0);
        s.add(sym1);
        s.add(sym2);

        expect(s.lookup("myVar", undefined, sym0)).toEqual([sym1]);
        expect(s.lookup("myVar", undefined, sym1)).toEqual([sym2]);
    });

    it("can iterate multiple symbols across scopes", () => {
        s.enterScope();
        s.add({ identifier: "myVar", type: "class" });
        s.add({ identifier: "myVar", type: "func" });
        s.add({ identifier: "myVar", type: "var" });

        s.enterScope();
        s.add({ identifier: "myVar", type: "class" });
        s.add({ identifier: "myVar", type: "func" });
        s.add({ identifier: "myVar", type: "var" });

        s.enterScope();
        s.add({ identifier: "myVar", type: "class" });
        s.add({ identifier: "myVar", type: "func" });
        s.add({ identifier: "myVar", type: "var" });

        let syms: AstSymbol[] = [];
        for (let st of s) {
            syms.push(st);
        }

        expect(syms.length).toBe(9);
    });
});
