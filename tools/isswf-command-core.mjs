// No Node imports and no `process` access, like the other guard cores: the Claude hooks module and the Pi extensions share it.

// Heredoc bodies and quoted text with spaces, such as commit messages or scripts, only mention paths;
// a quoted single path is still an operand.
// The rest of a heredoc's opening line, such as its output redirection, is kept.
export const HEREDOC = /<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?(?:\n\s*\2\s*(?:\n|$)|$)/g;
export const QUOTED = /(["'])(?:(?!\1)[\s\S])*\1/g;

export const tokenize = () => [];
export const checkCommand = () => undefined;
export const guardCommand = () => ({});
