import { SymbolTable } from "../src/index";

describe("Symbol table tests", () => {
    let s: SymbolTable<string>;

    beforeEach(() => {
        s = new SymbolTable<string>();
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
});
