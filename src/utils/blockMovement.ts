import type {
  Transaction,
} from '@tiptap/pm/state'
import type {
  Node as ProseMirrorNode,
} from '@tiptap/pm/model'

type RemoveSourceResult = {
  transaction: Transaction
  sourceNode: ProseMirrorNode
}

export function removeSourceForMove(
  transaction: Transaction,
  sourcePos: number,
): RemoveSourceResult | null {

  const sourceNode =
    transaction.doc.nodeAt(
      sourcePos,
    )

  if (!sourceNode) {
    return null
  }

  const $source =
    transaction.doc.resolve(
      sourcePos,
    )

  const sourceParent =
    $source.parent

  if(sourceParent.type.name === 'doc') {
    transaction.delete(
      sourcePos,
      sourcePos +
      sourceNode.nodeSize,
    )
    return {
      transaction,
      sourceNode,
    }
  }

  if (sourceParent.type.name !== 'column') {
    return null
  }

  if(sourceParent.childCount > 1) {
    transaction.delete(
      sourcePos,
      sourcePos +
      sourceNode.nodeSize,
    )
    return {
      transaction,
      sourceNode,
    }
  }

  const columnDepth =
    $source.depth

  const columnsDepth =
    columnDepth - 1

  const columnsNode =
    $source.node(
      columnsDepth,
    )

  if (
    columnsNode.type.name !==
    'columns'
  ) {
    return null
  }

  const currentColumnIndex =
    $source.index(
      columnsDepth,
    )

  const siblingColumnIndex =
    currentColumnIndex === 0
      ? 1
      : 0

  const siblingColumn =
    columnsNode.child(
      siblingColumnIndex,
    )

  const columnsPos =
    $source.before(
      columnsDepth,
    )

  transaction.replaceWith(
    columnsPos,
    columnsPos +
    columnsNode.nodeSize,
    siblingColumn.content,
  )

  return {
    transaction,
    sourceNode,
  }
}