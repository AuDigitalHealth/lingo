// import {  useEditor ,EditorContent, EditorProvider, FloatingMenu, BubbleMenu } from '@tiptap/react'
// import { Editor } from "@tiptap/core";
// import StarterKit from '@tiptap/starter-kit'
// import { Toolbar } from './Toolbar'
// import { useState } from 'react'

// // define your extension array
// const extensions = [
//   StarterKit,
// ]

// const content = '<p>Hello World!</p>'

// export default function CommentAuthoror(){
//     console.log('this is the comment authoror')
//     const editable = true;
//     const [editorHtmlContent, setEditorHtmlContent] = useState(content.trim());

//     const editor = useEditor({
//       content,
//       extensions,
//       editable,
//       onUpdate: ({ editor }) => {
//           setEditorHtmlContent(editor.getHTML());
//           console.log(editor.getHTML());
//       },
//   })
//     return (
//         <>
//         <Toolbar editor={editor}/>
//         {/* <EditorProvider extensions={extensions} content={content} > */}
//           <EditorContent editor={editor}/>
//         {/* <FloatingMenu>This is the floating menu</FloatingMenu>
//         <BubbleMenu>This is the bubble menu</BubbleMenu> */}
//         {/* </EditorProvider> */}
//         </>
//     )
// }
