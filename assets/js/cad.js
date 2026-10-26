// Fine-detail helpers: the item balloons and sheet-reference boxes that tie the pledge list, the cart
// and the 3D price tags together.

// Item balloon: the pledge item number in a circle (decorative; the row itself names the part).
export const balloon = (n, small) => '<span class="balloon' + (small ? ' balloon--sm' : '') + '" aria-hidden="true">' + n + '</span>';
// Sheet-reference box: points at a budget sheet ("07.2") rather than at an item.
export const sheetRef = (s) => '<span class="balloon balloon--sheet" aria-hidden="true">' + s + '</span>';
