import PropTypes from 'prop-types'
import React, { useEffect, useState } from 'react'

import { GU, Tabs } from '@aragon/ui'

import {
  insertHeader,
  insertLink,
  insertOnStartOfLines,
  wrapTextWith,
} from './codemirror/codemirror-utils'
import Editor from './Editor'
import Preview from './Preview'
// import SourceSelect from './SourceSelect'
import ToolBar from './Toolbar/ToolBar'

const CONTENT = {
  EDITOR: 0,
  INPUT: 2,
  PREVIEW: 1,
}

const Markdown = ({ data: unsavedText, setData: setUnsavedText }) => {
  const [editor, setEditor] = useState()
  // const [ type, setType ] = useState(0)
  const [contentArea, setContentArea] = useState(CONTENT.EDITOR)

  useEffect(() => {
    if (editor && unsavedText === '') {
      editor.setValue(unsavedText)
    }
  }, [editor, unsavedText])

  const setSelectionSize = () => {
    insertHeader(editor)
  }

  const setSelectionUnorderedList = () => {
    insertOnStartOfLines(editor, '* ')
  }

  const setSelectionBold = async () => {
    wrapTextWith(editor, '**')
  }

  const setSelectionItalic = () => {
    wrapTextWith(editor, '*')
  }

  const setSelectionLink = () => {
    insertLink(editor, false)
  }

  const setSelectionCode = () => {
    wrapTextWith(editor, '`')
  }

  const setSelectionQuote = () => {
    insertOnStartOfLines(editor, '> ')
  }

  // TODO: Move this to parent
  // const submitDisabled = !unsavedText || unsavedText.trim().length === 0

  return (
    <div
      css={`
        display: flex;
        flex-direction: column;
        overflow: hidden;
        /* TODO: enable if we want the submit button stick to bottom */
        /* flex: 1; */
        max-height: 100%;
      `}
    >
      {/* <SourceSelect value={type} onChange={setType} /> */}
      <Tabs
        items={['Write', 'Preview']}
        selected={contentArea}
        onChange={setContentArea}
      />
      <div
        css={`
          min-height: ${30 * GU}px;
        `}
      >
        {contentArea === CONTENT.EDITOR && (
          <>
            <ToolBar
              setSelectionBold={setSelectionBold}
              setSelectionCode={setSelectionCode}
              setSelectionItalic={setSelectionItalic}
              setSelectionLink={setSelectionLink}
              setSelectionQuote={setSelectionQuote}
              setSelectionSize={setSelectionSize}
              setSelectionUnorderedList={setSelectionUnorderedList}
            />
            <Editor
              editor={editor}
              value={unsavedText}
              onChange={setUnsavedText}
              setEditor={setEditor}
            />
          </>
        )}

        {contentArea === CONTENT.PREVIEW && <Preview content={unsavedText} />}
      </div>
    </div>
  )
}

Markdown.propTypes = {
  data: PropTypes.string.isRequired,
  setData: PropTypes.func.isRequired,
}

export default Markdown
