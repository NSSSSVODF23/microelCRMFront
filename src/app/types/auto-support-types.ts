export interface AutoSupportNodes {
    defaultNodes: Node;
}

export enum NodeType {
    NORMAL = "NORMAL",
    PREDICATE = "PREDICATE",
    INPUT = "INPUT",
    TRUNK = "TRUNK",
    REDIRECT = "REDIRECT",
}

export enum PreprocessorType {
    USER_INFO = "USER_INFO"
}

export enum PredicateType {
    USER_CREDENTIALS = "USER_CREDENTIALS"
}

export interface Node {
    id: string;
    name: string;
    type: NodeType;
    preprocessorTypes: PreprocessorType[] | null;
    predicateType: PredicateType | null;
    predicateRedirection: {[key: number]: string | null} | null;
    predicateArgumentsToTokensMap: {[key:string]:string | null} | null;
    redirectId: string | null;
    messageTemplate: string | null;
    parent: string | null;
    children: Node[] | null;
}
