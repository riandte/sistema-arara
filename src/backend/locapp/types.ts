export interface Endereco {
  Logradouro: string
  Numero: string
  Complemento?: string | null
  Bairro: string
  Cidade: string
  UF: string
  CEP: string
  Principal?: boolean
}

export interface Contato {
  Nome: string
  Telefone?: string | null
  Email?: string | null
  Cargo?: string | null
}

export interface Pessoa {
  Id?: string
  Numero?: number
  CpfCnpj: string
  Nome: string
  NomeFantasia?: string | null
  Email?: string | null
  Enderecos?: Endereco[]
  Contatos?: Contato[]
}

export interface PessoaResponse {
  Sucesso: boolean
  Pessoa?: Pessoa
}

export interface PessoasResponse {
  Sucesso: boolean
  Pessoas?: Pessoa[]
  Pessoa?: Pessoa // Fallback if API returns single object
}

export interface InserirPessoaResponse {
  Sucesso: boolean
  Numeros?: number[]
}

export interface Contrato {
  Id: string
  Numero: number
  CpfCnpj: string
  Nome: string
  DataEmissao: string
  Status: string
  ValorTotal: number
}
