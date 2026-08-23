import type {
    Node as ProseMirrorNode,
} from '@tiptap/pm/model'

export function isPositionInsideColumn(
    doc: ProseMirrorNode,
    pos: number,
) {
    const $pos =
        doc.resolve(pos)

    for (
        let depth = 0;
        depth <= $pos.depth;
        depth++
    ) {
        if (
            $pos.node(depth)
                .type.name === 'column'
        ) {
            return true
        }
    }

    return false
}