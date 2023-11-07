${
    filedFile?.name
      ? `try{\n ${
          `if (files){` + filedFile?.validation.includes('file')
            ? `data['${filedFile?.name}'] = files.filename`
            : filedFile?.validation.includes('files')
            ? `data['${filedFile?.name}'] = files.map((file) => file.filename);`
            : ''
        }}`
      : ''
  }