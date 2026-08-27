import { z } from 'zod'

// ---- Status ----
export type StatusFrequencia = 'falta' | 'atestado' | null

// ---- Schemas Zod ----
export const AlunoSchema = z.object({
  id: z.number(),
  ano: z.number().int(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  created_at: z.string(),
})

export const FrequenciaSchema = z.object({
  id: z.number(),
  aluno_id: z.number(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD'),
  status: z.enum(['falta', 'atestado']).nullable(),
})

export const ConfigSchema = z.record(z.string(), z.string())

export const BackupSchema = z.object({
  alunos: z.array(AlunoSchema),
  frequencias: z.array(FrequenciaSchema),
  config: ConfigSchema.optional().default({}),
})

export type BackupType = z.infer<typeof BackupSchema>

// ---- TypeScript interfaces (para uso no código) ----
export interface Aluno {
  id: number
  ano: number
  nome: string
  created_at: string
}

export interface Frequencia {
  id: number
  aluno_id: number
  data: string
  status: StatusFrequencia
}

export interface ResumoAluno {
  faltas: number
  atestados: number
  total: number
}
