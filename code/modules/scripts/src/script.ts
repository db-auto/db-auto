import { composeNameAndValidators, ErrorsAnd, NameAnd, NameAndValidator, safeObject, toArray, validateChild, validateChildItemOrArray, validateChildString, validateString, validateValue } from "@dbpath/utils";

export interface Param {
  description?: string
}
type ScriptType = 'select' | 'update'
export interface Script {
  type?: ScriptType
  description: string | string[]
  comments?: string | string[]
  params?: NameAnd<Param>
  script: string
}

export interface CleanScript {
  type: ScriptType,
  description: string[],
  comments: string[],
  params: NameAnd<Param>
  script: string
}


export const validateParam: NameAndValidator<Param> = composeNameAndValidators<Param> (
  composeNameAndValidators ( validateChildString ( 'description', true ) )
)

export const validateScript = composeNameAndValidators<Script> (
  validateChild ( 'type', validateValue ( 'update', 'select' ), true ),
  validateChildString ( 'script' ),
  validateChildItemOrArray ( 'description', validateString ( true ) ),
  validateChildItemOrArray ( 'comments', validateString ( true ), true ),
  validateChild ( 'params', validateParam, true ),
)

export function cleanScript ( prefix: string, s: Script ): ErrorsAnd<CleanScript> {
  const errors = validateScript ( prefix ) ( s )
  if ( errors.length > 0 ) return errors
  return {
    type: s.type ? s.type : 'select',
    description: toArray ( s.description ),
    comments: toArray ( s.comments ),
    params: safeObject ( s.params ),
    script: s.script,
  }
}

export function preprocessorFnForScript ( nameAndScript: NameAnd<CleanScript> ): (( s: string ) => string) {
  return ( s: string ) => {
    const script = nameAndScript[ s ]
    if ( script === undefined ) throw `Script ${s} is not defined. Legal values are: ${Object.keys ( nameAndScript ).sort ()}`
    return script.script
  }
}