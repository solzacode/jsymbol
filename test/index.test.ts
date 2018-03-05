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
        }).toThrow("Symbol someVariable already found in local scope");
    });

    it("allows adding same symbol in different scopes", () => {
        s.add("someVariable");
        s.enterScope();
        s.add("someVariable");
        expect(true).toBe(true);
    });

    it("looks up symbol just added", () => {
        s.add("someVariable");
        expect(s.lookup("someVariable")).toBe("someVariable");
    });

    it("local lookup of symbol added in parent scope won't resolve", () => {
        s.add("someVariable");
        s.enterScope();

        expect(s.localLookup("someVariable")).toBeUndefined();

        s.exitScope();
        expect(s.localLookup("someVariable")).toBe("someVariable");
    });

    it("finds a symbol added in parent scope from a child scope", () => {
        s.add("someVariable");
        s.enterScope();

        expect(s.lookup("someVariable")).toBe("someVariable");
    });

    it("cannot find symbol added in child scope from parent scope", () => {
        s.enterScope();
        s.add("someVariable");
        expect(s.lookup("someVariable")).toBe("someVariable");

        s.exitScope();
        expect(s.lookup("someVariable")).toBeUndefined();
    });

    it("can add and lookup symbol using AstSymbol structure", () => {
        let sym: AstSymbol = { identifier: "someVariable" };
        let st: SymbolTable<AstSymbol> = new SymbolTable(symbol => symbol.identifier);

        st.add(sym);
        expect(st.lookup(sym)).toBe(sym);
        expect(st.lookup(sym).identifier).toBe("someVariable");
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
        expect(s.lookup("s2")).toBe("s2");
        expect(s.localLookup("s1")).toBeUndefined();
        expect(s.lookup("s1")).toBe("s1");
    });

    it("looks up AstSymbol from child scope", () => {
        let sym: AstSymbol = { identifier: "someVariable" };
        let st: SymbolTable<AstSymbol> = new SymbolTable<AstSymbol>(symbol => symbol.identifier);

        st.add(sym);
        expect(st.lookup(sym)).toBe(sym);
        expect(st.lookup(sym).identifier).toBe("someVariable");

        st.enterScope();
        expect(st.localLookup(sym)).toBeUndefined();
        expect(st.lookup(sym)).toBe(sym);
    });

    it("add and lookup symbol with a key different from the symbol", () => {
        let sym: AstSymbol = { identifier: "someVariable" };
        let st: SymbolTable<AstSymbol> = new SymbolTable<AstSymbol>(symbol => symbol.identifier);

        st.add("s1", sym);
        expect(st.lookup("s1")).toBe(sym);
        expect(st.lookup(sym)).toBeUndefined();
    });

    it("add symbols to global scope from any scope and find them", () => {
        s.addToGlobalScope("s1");
        s.enterScope();
        s.addToGlobalScope("s2");

        expect(s.localLookup("s1")).toBeUndefined();
        expect(s.lookup("s1")).toBe("s1");
        expect(s.localLookup("s2")).toBeUndefined();
        expect(s.lookup("s2")).toBe("s2");
    });

    it ("can't add duplicate symbols to global scope from any scope", () => {
        s.enterScope();
        s.addToGlobalScope("s1");
        s.enterScope();

        expect(() => {
            s.addToGlobalScope("s1");
        }).toThrow("Symbol s1 already found in global scope");
    });

    it ("looks up AstSymbol added to global scope", () => {
        let sym = { identifier: "someVar" };
        let st = new SymbolTable<AstSymbol>(symbol => symbol.identifier);

        st.addToGlobalScope(sym);
        st.enterScope();

        expect(st.lookup(sym)).toBe(sym);
        expect(st.lookup("someVar")).toBe(sym);
        expect(st.localLookup(sym)).toBeUndefined();
        expect(st.localLookup("someVar")).toBeUndefined();
    });

    it ("works with custom symbol types", () => {
        let sym = new MySymbol("string", MySymbolType.Class);
        let st = new SymbolTable<MySymbol>(symbol => symbol.identifier);

        st.add(sym);

        expect(st.lookup("string")).toBe(sym);
    });
});
