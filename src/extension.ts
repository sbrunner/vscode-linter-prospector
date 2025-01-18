import {
  LinterGetOffensesFunction,
  LinterParseFixOutputFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from 'vscode-linter-api';
import { Uri } from 'vscode';

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

const messageRegex = /(?<message>.*) \[See: (?<url>.*)\]/;

const offenseSeverity: { [key: string]: LinterOffenseSeverity } = {
  convention: LinterOffenseSeverity.warning,
  warning: LinterOffenseSeverity.error,
};

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }: { stdout: string; uri: Uri }) => {
  const result: ProspectorOffense = JSON.parse(stdout);
  const offenses: LinterOffense[] = [];

  result.messages.forEach((message: ProspectorMessage) => {
    let messageString = message.message;
    let docsUrl = '';
    const match = message.message.match(messageRegex);
    if (match) {
      messageString = match.groups!.message;
      docsUrl = match.groups!.url;
    }

    offenses.push({
      uri,
      lineStart: Math.max(0, message.location.line - 1),
      columnStart: Math.max(0, message.location.character - 1),
      lineEnd: Math.max(0, message.location.lineEnd || message.location.line - 1),
      columnEnd: Math.max(0, message.location.characterEnd || message.location.character),
      code: `${message.source}:${message.code}`,
      message: messageString,
      severity: LinterOffenseSeverity.error,
      source: 'prospector',
      correctable: message.fixable || false,
      docsUrl: message.docUrl || docsUrl,
    });
  });

  return Promise.resolve(offenses);
};

export const parseFixOutput: LinterParseFixOutputFunction = ({ stdout }: { stdout: string }) =>
  Promise.resolve(stdout);
