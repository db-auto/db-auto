import { CleanScript, cleanScript, preprocessorFnForScript, Script, validateScript } from "./script";
import { NameAnd } from "@dbpath/utils";

describe ( "validateScript", () => {
  it ( "should validate a legal script", () => {
    expect ( validateScript ( "prefix" ) ( { type: 'select', description: 'does something', script: "someScript" } ) ).toEqual ( [] )
    expect ( validateScript ( "prefix" ) ( { description: 'does something', script: "someScript", params: { a: {} } } ) ).toEqual ( [] )
  } )
  it ( "should report issues with malformed scripts", () => {
    expect ( validateScript ( "prefix" ) ( {} as any ) ).toEqual ( [
      "prefix.script is undefined",
      "prefix.description is undefined"
    ] )
    expect ( validateScript ( "prefix" ) ( { description: 1, params: 1, comments: 1, type: 'as' } as any ) ).toEqual ( [
      "prefix.type is [\"as\"] not one of [\"update\",\"select\"]",
      "prefix.script is undefined",
      "prefix.description is [1] which is a number and not a string",
      "prefix.comments is [1] which is a number and not a string"
    ] )
  } )

} )

describe ( "cleanScript", () => {
  it ( "should return a cleaned script", () => {
    expect ( cleanScript ( "prefix", { description: 'does something', script: "someScript" } ) ).toEqual ( {
      "comments": [],
      "description": [
        "does something"
      ],
      "params": {},
      "script": "someScript",
      "type": "select"
    } )
  } )
  it ( "should return a cleaned update script", () => {
    expect ( cleanScript ( "prefix", { type: 'update', description: 'does something', script: "someScript" } ) ).toEqual ( {
      "comments": [],
      "description": [ "does something" ],
      "params": {},
      "script": "someScript", "type": "update"
    } )
  } )
  it ( "should validate the script", () => {
    expect ( cleanScript ( "prefix", {} as any ) ).toEqual ( [
      "prefix.script is undefined",
      "prefix.description is undefined"
    ] )
  } )
} )

const script: NameAnd<CleanScript> = {
  one: {
    type: "select",
    comments: [],
    description: [ 'does something' ],
    params: {},
    script: "scriptOne",
  },
  two: {
    type: "select",
    comments: [],
    description: [ 'does something' ],
    params: {},
    script: "scriptTwo",

  }
}
describe ( 'preprocessorForScript', () => {
  it ( "should use the clean script to return the script for the name", () => {
    expect ( preprocessorFnForScript ( script ) ( "one" ) ).toEqual ( "scriptOne" )
    expect ( preprocessorFnForScript ( script ) ( "two" ) ).toEqual ( "scriptTwo" )
  } )
  it ( "should return an error if the script is not found", () => {
    expect ( () => preprocessorFnForScript ( script ) ( "three" ) ).toThrow ( "Script three is not defined. Legal values are: one,two" )
  } )
} )