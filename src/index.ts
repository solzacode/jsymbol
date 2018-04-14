export interface AstSymbol<TType = any> {
    identifier: string;
    type?: TType;
    parent?: AstSymbol<TType>;
}

export interface SymbolLookupMethod<TSymbol extends AstSymbol = AstSymbol> {
    (key: string | TSymbol, type?: any, parent?: TSymbol | undefined): TSymbol[] | undefined;
}

export class SymbolTable<TSymbol extends AstSymbol = AstSymbol> {
    symbols: Map<string, TSymbol[]>;
    keyFunc: (s: TSymbol) => string;
    parent?: SymbolTable<TSymbol>;
    allowDuplicates: boolean;

    private _globalSymbols: Map<string, TSymbol[]>;

    constructor(symbolKeyProvider?: (s: TSymbol) => string) {
        this.symbols = new Map<string, TSymbol[]>();
        this.keyFunc = symbolKeyProvider || (s => s.identifier !== undefined ? s.identifier : s.toString());
        this.allowDuplicates = true;

        this._globalSymbols = this.symbols;
    }

    enterScope(): void {
        let newParent = new SymbolTable<TSymbol>(this.keyFunc);
        newParent.symbols = this.symbols;
        newParent.parent = this.parent;
        newParent._globalSymbols = this._globalSymbols;

        this.parent = newParent;
        this.symbols = new Map<string, TSymbol[]>();
    }

    exitScope(): void {
        if (!this.parent) {
            throw Error("Already at the root scope");
        }

        this.symbols = this.parent.symbols;
        this.parent = this.parent.parent;
    }

    localLookup: SymbolLookupMethod<TSymbol> = (key, type = undefined, parent = undefined) => {
        return this.lookupInternal(this.symbols, key, type, parent);
    }

    lookup: SymbolLookupMethod<TSymbol> = (key, type = undefined, parent = undefined) => {
        let keyToLookup: string = this.getKey(key);

        let result = this.localLookup(keyToLookup, type, parent);
        return (result && result.length)
            ? result
            : (this.parent ? this.parent.lookup(keyToLookup, type, parent) : undefined);
    }

    add(key: string | TSymbol, value?: TSymbol): void {
        this.addSymbol(key, value, this.symbols);
    }

    addToGlobalScope(key: string | TSymbol, value?: TSymbol): void {
        this.addSymbol(key, value, this._globalSymbols);
    }

    *[Symbol.iterator](): IterableIterator<TSymbol> {
        for (let sym of this.symbols.values()) {
            yield *sym;
        }

        if (this.parent) {
            let gen: Iterable<TSymbol> = this.parent[Symbol.iterator]();
            if (gen) {
                yield *gen;
            }
        }
    }

    private getKey(key: string | TSymbol): string {
        return typeof key === "string" ? key : this.keyFunc(key);
    }

    private lookupInternal(
        map: Map<string, TSymbol[]>,
        key: TSymbol | string,
        type: any = undefined,
        parent: TSymbol | undefined = undefined
    ): TSymbol[] | undefined {
        let matchedSymbols = map.get(this.getKey(key));
        let result: TSymbol[] | undefined = [];

        if (matchedSymbols && matchedSymbols.length) {
            for (let s of matchedSymbols) {
                if ((type === undefined || s.type === type) && (parent === undefined || s.parent === parent)) {
                    result.push(s);
                }
            }
        }

        return (result && result.length) ? result : undefined;
    }

    private addSymbol(key: string | TSymbol, value: TSymbol | undefined, map: Map<string, TSymbol[]>) {
        value = value || (<TSymbol> key);
        key = this.getKey(key);

        let matchedSymbols = map.get(key);
        if (matchedSymbols) {
            if (!this.allowDuplicates) {
                throw Error(`Symbol ${key} already found in desired scope`);
            }

            for (let s of matchedSymbols) {
                if (s.type === value.type && s.parent === value.parent) {
                    throw Error(`Symbol ${key} already found in desired scope`);
                }
            }

            matchedSymbols.push(value);
        } else {
            map.set(key, [value]);
        }
    }
}
