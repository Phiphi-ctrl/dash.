import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Pilcrow,
  Sigma,
  Code2,
  type LucideIcon,
  Columns2,
  AudioLines,
  Image as ImageIcon,
  FileText,
  List,
  ListChecks,
  Link2,
} from 'lucide-react'

export type BlockInsertCommand =
    | {
    type: 'paragraph'
}
    | {
    type: 'heading'
    level: 1 | 2 | 3 | 4
}
    | {
    type: 'blockMath'
}
    | {
    type: 'columns'
}
    | {
    type: 'codeBlock'
}
    | {
    type: 'bulletList'
}
    | {
    type: 'taskList'
}
    | {
    type: 'audioBlock'
}
    | {
    type: 'imageBlock'
}
    | {
    type: 'pdfBlock'
}

export type SlashInsertCommand =
  | BlockInsertCommand
  | {
  type: 'inlineMath'
}
  | {
  type: 'inlineLink'
}

export type SlashOption = {
  label: string
  description: string
  Icon: LucideIcon

  keywords: string[]

  command: SlashInsertCommand
}

export type BlockOption = {
    label: string
    description: string
    Icon: LucideIcon

    keywords: string[]

    command: BlockInsertCommand
}

export const blockOptions: BlockOption[] = [
    {
        label: 'Paragraph',
        description: 'Plain text',
        Icon: Pilcrow,

        keywords: [
            'paragraph',
            'text',
            'plain',
            'p',
        ],

        command: {
            type: 'paragraph',
        },
    },

    {
        label: 'Heading 1',
        description: 'Large section heading',
        Icon: Heading1,

        keywords: [
            'heading',
            'h1',
            'title',
            'large',
        ],

        command: {
            type: 'heading',
            level: 1,
        },
    },

    {
        label: 'Heading 2',
        description: 'Medium section heading',
        Icon: Heading2,

        keywords: [
            'heading',
            'h2',
            'medium',
        ],

        command: {
            type: 'heading',
            level: 2,
        },
    },

    {
        label: 'Heading 3',
        description: 'Small section heading',
        Icon: Heading3,

        keywords: [
            'heading',
            'h3',
            'small',
        ],

        command: {
            type: 'heading',
            level: 3,
        },
    },

    {
        label: 'Heading 4',
        description: 'Small subsection heading',
        Icon: Heading4,

        keywords: [
            'heading',
            'h4',
            'small',
            'subsection',
        ],

        command: {
            type: 'heading',
            level: 4,
        },
    },

    {
        label: 'Equation',
        description: 'Display a LaTeX equation',
        Icon: Sigma,

        keywords: [
            'equation',
            'math',
            'latex',
            'formula',
            'block math',
        ],

        command: {
            type: 'blockMath',
        },
    },

    {
        label: 'Columns',
        description: 'Add a column layout',
        Icon: Columns2,

        keywords: [
            'columns',
            'pillars',
            'cols',
        ],
        command: {
          type: 'columns',
        }
    },

    {
      label:
        'Code',

      description:
        'Add a code block',

      Icon:
      Code2,

      keywords: [
        'code',
        'programming',
        'snippet',
        'script',
      ],

      command: {
        type:
          'codeBlock',
      },
    },

    {
      label:
        'Bulleted List',

      description:
        'Add a bullet list',

      Icon:
        List,

      keywords: [
        'bulleted',
        'bullet',
        'list',
        'unordered',
        'ul',
      ],

      command: {
        type:
          'bulletList',
      },
    },

    {
      label:
        'Checklist',

      description:
        'Add checkable items',

      Icon:
        ListChecks,

      keywords: [
        'checklist',
        'todo',
        'task',
        'checkbox',
        'checked',
        'list',
      ],

      command: {
        type:
          'taskList',
      },
    },

    {
      label:
        'Audio',

      description:
        'Add an audio block',

      Icon:
        AudioLines,

      keywords: [
        'audio',
        'recording',
        'microphone',
        'mic',
      ],

      command: {
        type:
          'audioBlock',
      },
    },

  {
    label:
      'Banner',

    description:
      'Upload a cover image',

    Icon:
    ImageIcon,

    keywords: [
      'banner',
      'cover',
      'header',
      'image',
      'picture',
      'photo',
      'upload',
    ],

    command: {
      type:
        'imageBlock',
    },
  },

  {
    label:
      'PDF',

    description:
      'Upload a PDF document',

    Icon:
      FileText,

    keywords: [
      'pdf',
      'document',
      'file',
      'viewer',
      'upload',
    ],

    command: {
      type:
        'pdfBlock',
    },
  },
]

const slashOnlyOptions: SlashOption[] = [
  {
    label: 'Inline Equation',
    description: 'Insert LaTeX within text',
    Icon: Sigma,

    keywords: [
      'inline',
      'equation',
      'math',
      'latex',
      'formula',
    ],

    command: {
      type: 'inlineMath',
    },
  },
  {
    label: 'Inline Link',
    description: 'Insert a website link within text',
    Icon: Link2,
    keywords: ['link', 'url', 'website', 'reference'],
    command: { type: 'inlineLink' },
  },
]

const slashOptions: SlashOption[] = [
  ...blockOptions,
  ...slashOnlyOptions,
]

export function filterSlashOptions(
  query: string,
  inlineOnly = false,
) {
  const normalizedQuery =
    query
      .trim()
      .toLowerCase()

  const options =
    inlineOnly
      ? slashOnlyOptions
      : slashOptions

  if (!normalizedQuery) {
    return options
  }

  return options.filter(
    ({
       label,
       description,
       keywords,
     }) => {
      const searchableText = [
        label,
        description,
        ...keywords,
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(
        normalizedQuery,
      )
    },
  )
}

export function filterBlockOptions(
    query: string,
) {
    const normalizedQuery =
        query
            .trim()
            .toLowerCase()

    if (!normalizedQuery) {
        return blockOptions
    }

    return blockOptions.filter(
        ({
             label,
             description,
             keywords,
         }) => {
            const searchableText = [
                label,
                description,
                ...keywords,
            ]
                .join(' ')
                .toLowerCase()

            return searchableText.includes(
                normalizedQuery,
            )
        },
    )
}
