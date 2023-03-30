import { composeNameAndValidators, NameAnd, NameAndValidator, validateChild, validateChildDefined, validateNameAnd } from "@dbpath/utils";
import { CleanEnvironment, cleanEnvironment, Environment, environmentValidator } from "@dbpath/environments";
import { Summary, summaryValidator } from "@dbpath/config";

export interface Config {
  environments: NameAnd<Environment>,
  summary: Summary
}
export interface CleanConfig {
  environments: NameAnd<CleanEnvironment>,

}


export const cleanConfig = ( envVars: NameAnd<string> ) => ( config: Config ): CleanConfig => ({
  environments: cleanEnvironment ( envVars, config.environments ),

});

export const envValidator: NameAndValidator<Config> = composeNameAndValidators (
  validateChildDefined ( 'environments' ),
  validateChild ( 'environments', validateNameAnd ( environmentValidator ) ),
  validateChildDefined ( 'summary' ),
  validateChild ( 'summary', summaryValidator )
)
