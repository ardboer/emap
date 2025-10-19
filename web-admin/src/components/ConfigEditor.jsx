import Editor from "@monaco-editor/react";
import { useState } from "react";

const ConfigEditor = ({ config, onChange }) => {
  const [jsonError, setJsonError] = useState(null);
  const [editorValue, setEditorValue] = useState(
    JSON.stringify(config, null, 2)
  );

  const handleEditorChange = (value) => {
    setEditorValue(value);
    try {
      const parsed = JSON.parse(value);
      setJsonError(null);
      onChange(parsed);
    } catch (error) {
      setJsonError(error.message);
    }
  };

  return (
    <div>
      <div className="json-editor-container">
        <Editor
          height="400px"
          defaultLanguage="json"
          value={editorValue}
          onChange={handleEditorChange}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
      {jsonError && (
        <div className="form-error" style={{ marginTop: "0.5rem" }}>
          Invalid JSON: {jsonError}
        </div>
      )}
    </div>
  );
};

export default ConfigEditor;
