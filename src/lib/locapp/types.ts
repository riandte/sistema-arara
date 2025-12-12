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

export interface InserirPessoaResponse {
  Sucesso: boolean
  Numeros?: number[]
}

export interface Titulo {
  Id: string
  Numero: number
  CpfCnpj: string
  Tipo: string
  DataEmissao: string
  DataVencimento: string
  DataBaixa?: string | null
  Historico?: string | null
  Status: string
  TipoDocumento?: string | null
  NumDocOrigem?: string | null
  Parcela?: number
  FormaPagamento?: string | null
  Valor?: number
  ValorLiquido?: number
  Saldo?: number
}

export interface TitulosPeriodoResponse {
  Sucesso: boolean
  Titulos: Titulo[]
}

export interface TituloPorIdResponse {
  Sucesso: boolean
  Titulos: Titulo
}
