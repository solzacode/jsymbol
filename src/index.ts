export class AstSymbol<TExtra = {}, TType = any> {
    constructor(public identifier: string, public type?: TType, public parent?: AstSymbol<TExtra, TType>) {
    }
}

export class SymbolTable<TSymbol = AstSymbol> {
    parent?: SymbolTable<TSymbol>;
    keyFunc?: (s: TSymbol) => string;

    constructor(
        public symbols: Map<string, TSymbol> = new Map<string, TSymbol>(),
        symbolKeyProvider?: (s: TSymbol) => string) {
            if (symbolKeyProvider) {
                this.keyFunc = symbolKeyProvider;
            }
    }

    enterScope(): void {
        let newParent: SymbolTable<TSymbol> = new SymbolTable<TSymbol>(this.symbols, this.keyFunc);
        newParent.parent = this.parent;

        this.parent = newParent;
        this.symbols = new Map<string, TSymbol>();
    }

    exitScope(): void {
        if (!this.parent) {
            throw Error("Already at the root scope");
        }

        this.symbols = this.parent.symbols;
        this.parent = this.parent.parent;
    }

    localLookup(key: string | TSymbol): TSymbol | undefined {
        let keyToLookup: string = this.getKey(key);
        if (this.symbols.has(keyToLookup)) {
            return this.symbols.get(keyToLookup);
        }

        return undefined;
    }

    lookup(key: string | TSymbol): TSymbol | undefined {
        let keyToLookup: string = this.getKey(key);
        let current: SymbolTable<TSymbol> | undefined = this;
        let found: TSymbol | undefined = undefined;

        while (current && !found) {
            found = current.localLookup(keyToLookup);
            if (!found) {
                current = current.parent;
            }
        }

        return found;
    }

    add(key: string | TSymbol, value?: TSymbol): void {
        value = value || <TSymbol> key;
        key = this.getKey(key);

        if (this.localLookup(key)) {
            throw Error(`Symbol ${key} already found in local scope`);
        }

        this.symbols.set(key, value);
    }

    private getKey(key: string | TSymbol): string {
        return typeof key === "string" ? key : (this.keyFunc ? this.keyFunc(key) : key.toString());
    }
}

export type AstSymbolTable = SymbolTable<AstSymbol>;
