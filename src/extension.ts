import {
  LinterGetIgnoreLinePragmaFunction,
  LinterGetOffensesFunction,
  LinterParseFixOutputFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from 'vscode-linter-api';
import { Uri } from 'vscode';

const ignoreNoqa = /#\s*noqa:([^#]*[^# ])(\s*#.*)?$/i
const ignorePylint = /#\s*pylint: disable=([^#]*[^# ])(\s*#.*)?$/i
const ignoreMypy = /#\s*type: ignore\[([^#]*[^# ])\](\s*#.*)?$/i


interface ProspectorOffense {
  messages: ProspectorMessage[];
}

interface ProspectorMessage {
  source: string;
  code: string;
  location: ProspectorLocation;
  message: string;
  docUrl?: string;
  fixable?: boolean;
}

interface ProspectorLocation {
  path: string;
  module: string;
  function: string;
  line: number;
  character: number;
  lineEnd?: number;
  characterEnd?: number;
}

const offenseSeverity: { [key: string]: LinterOffenseSeverity } = {
  convention: LinterOffenseSeverity.warning,
  warning: LinterOffenseSeverity.error,
};

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }: { stdout: string; uri: Uri }) => {
  const result: ProspectorOffense = JSON.parse(stdout);
  const offenses: LinterOffense[] = [];

  result.messages.forEach((message: ProspectorMessage) => {
    let messageString = message.message;

    offenses.push({
      uri,
      lineStart: Math.max(0, message.location.line - 1),
      columnStart: Math.max(0, message.location.character),
      lineEnd: Math.max(
        0,
        (message.location.lineEnd === undefined ? message.location.line : message.location.lineEnd) - 1,
      ),
      columnEnd: Math.max(
        0,
        message.location.characterEnd === undefined
          ? message.location.character
          : message.location.characterEnd,
      ),
      code: `${message.source}:${message.code}`,
      message: messageString,
      severity: LinterOffenseSeverity.error,
      source: 'prospector',
      correctable: message.fixable || false,
      docsUrl: message.docUrl,
    });
  });

  return Promise.resolve(offenses);
};

export const parseFixOutput: LinterParseFixOutputFunction = ({ stdout }: { stdout: string }) =>
  Promise.resolve(stdout);

export const getIgnoreLinePragma: LinterGetIgnoreLinePragmaFunction = async ({ line, indent, code }) => {
  let codeSplit = code.split(':', 1)
  let tool = codeSplit[0];
  let codeOnly = codeSplit[1];

  if (tool == 'pylint') {
    let pylintMatch = ignorePylint.exec(line.text);
    if (pylintMatch == null) {
      return Promise.resolve(line.text + ' # pylint: disable=' + code);
    }
    let pylintIgnoreList = pylintMatch[1].split(',');
    if (pylintIgnoreList.includes(codeOnly)) {
      return Promise.resolve(line.text);
    }
    pylintIgnoreList.push(codeOnly);
    return Promise.resolve(line.text.replace(ignorePylint, '# pylint: disable=' + pylintIgnoreList.join(',') + pylintMatch[2]));
  }
  else if (tool == 'mypy') {
    let mypyMatch = ignoreMypy.exec(line.text);
    if (mypyMatch == null) {
      return Promise.resolve(line.text + ' # type: ignore[' + code + ']');
    }
    let mypyIgnoreList = mypyMatch[1].split(',');
    if (mypyIgnoreList.includes(codeOnly)) {
      return Promise.resolve(line.text);
    }
    mypyIgnoreList.push(codeOnly);
    return Promise.resolve(line.text.replace(ignoreMypy, '# type: ignore[' + mypyIgnoreList.join(',') + ']' + mypyMatch[2]));
  }
  else {
    let noqaMatch = ignoreNoqa.exec(line.text);
    if (noqaMatch == null) {
      return Promise.resolve(line.text + ' # noqa ' + code);
    }
    let noqaIgnoreList = noqaMatch[1].split(',');
    if (noqaIgnoreList.includes(codeOnly)) {
      return Promise.resolve(line.text);
    }
    noqaIgnoreList.push(codeOnly);
    return Promise.resolve(line.text.replace(ignoreNoqa, '# noqa: ' + noqaIgnoreList.join(',') + noqaMatch[2]));
  }
};
