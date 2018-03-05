export class AstSymbol<TExtra = any, TType = any> {
    extra?: TExtra;

    constructor(public identifier: string, public type?: TType, public parent?: AstSymbol<TExtra, TType>) {
    }
}

export class SymbolTable<TSymbol = AstSymbol> {
    symbols: Map<string, TSymbol>;
    keyFunc: (s: TSymbol) => string;
    parent?: SymbolTable<TSymbol>;

    private _globalSymbols: Map<string, TSymbol>;

    constructor(symbolKeyProvider?: (s: TSymbol) => string) {
        this.symbols = new Map<string, TSymbol>();
        this.keyFunc = symbolKeyProvider || (s => s.toString());

        this._globalSymbols = this.symbols;
    }

    enterScope(): void {
        let newParent: SymbolTable<TSymbol> = new SymbolTable<TSymbol>(this.keyFunc);
        newParent.symbols = this.symbols;
        newParent.parent = this.parent;
        newParent._globalSymbols = this._globalSymbols;

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
        return this.symbols.get(this.getKey(key));
    }

    lookup(key: string | TSymbol): TSymbol | undefined {
        let keyToLookup: string = this.getKey(key);
        return this.localLookup(keyToLookup) || (this.parent ? this.parent.lookup(keyToLookup) : undefined);
    }

    add(key: string | TSymbol, value?: TSymbol): void {
        value = value || (<TSymbol> key);
        key = this.getKey(key);

        if (this.localLookup(key)) {
            throw Error(`Symbol ${key} already found in local scope`);
        }

        this.symbols.set(key, value);
    }

    addToGlobalScope(key: string | TSymbol, value?: TSymbol): void {
        value = value || (<TSymbol> key);
        key = this.getKey(key);

        if (this.globalLookup(key)) {
            throw Error(`Symbol ${key} already found in global scope`);
        }

        this._globalSymbols.set(key, value);
    }

    private globalLookup(key: string | TSymbol): TSymbol | undefined {
        return this._globalSymbols.get(this.getKey(key));
    }

    private getKey(key: string | TSymbol): string {
        return typeof key === "string" ? key : this.keyFunc(key);
    }
}
