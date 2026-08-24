import {
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Sigma,
  Code2,
  type LucideIcon, Columns2,
} from 'lucide-react'

export type BlockInsertCommand =
    | {
    type: 'paragraph'
}
    | {
    type: 'heading'
    level: 1 | 2 | 3
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

export type SlashInsertCommand =
  | BlockInsertCommand
  | {
  type: 'inlineMath'
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