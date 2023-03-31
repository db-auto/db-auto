import { composeNameAndValidators, NameAnd, NameAndValidator, validateChild, validateChildDefined, validateNameAnd } from "@dbpath/utils";
import { CleanEnvironment, cleanEnvironment, Environment, environmentValidator } from "@dbpath/environments";
import { cleanSummary, Summary, summaryValidator } from "@dbpath/config";

export interface Config {
  environments: NameAnd<Environment>,
  summary: Summary
}
export interface CleanConfig {
  environments: NameAnd<CleanEnvironment>,
  summary: Summary

}


export const cleanConfig = ( envVars: NameAnd<string> ) => ( config: Config ): CleanConfig => {
  let result = {
    environments: cleanEnvironment ( envVars, config.environments ),
    summary: cleanSummary ( config.summary )
  };
  return result;
};

export const envValidator: NameAndValidator<Config> = composeNameAndValidators (
  validateChildDefined ( 'environments' ),
  validateChild ( 'environments', validateNameAnd ( environmentValidator ) ),
  validateChildDefined ( 'summary' ),
  validateChild ( 'summary', summaryValidator )
)
