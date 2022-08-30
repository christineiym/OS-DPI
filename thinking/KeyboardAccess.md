# Thinking about keyboard access in the designer

In the split display. Maybe the UI is only a single tab location at its top
level. Activating it with space or enter, allows moving around within it using
the arrows just like the tree. Maybe you're just moving in the tree effectively.

In the DI (right half of the screen). The Tree is only a single tab location.
You use space/enter to activate it then you move with the arrow keys. This is
WAI standard behavior. Activating a tree entry with space/enter jumps focus to
the editing controls for that node. Where is focus? On the menu? On the first
input?

How do you get back to the tree? Maybe tabbing out of the controls takes you
back to the tree?

Maybe there is a button in the tab order to go the UI? It could be after the
tree.

So the tab order could be:

1.  Tree (space to activate)

    - Arrows to move
    - Space/enter to edit

      - Tab to move between editor controls
      - Tab out of last control to return to Tree

    - Tab to go to UI

2.  UI (space to activate)

    - Arrows to move
    - Tab to return to Tree

## An alternative model for keyboard access in the editor
### Models for accessibility in trees with HTML inputs:
- (Primary) The Excel 365 online editor
  - All keyboard shortcuts in the [Excel 365 online editor](https://support.microsoft.com/en-us/office/keyboard-shortcuts-in-excel-1798d9d5-842a-42b8-9c99-9b7213f0040f#bkmk_ribbonwin)
  - Good overall shortcut access:
    - Search field to access all controls by fuzzy matching (Alt-Q)
    - Menus (and options within menus) (Alt + select from what shows up)
- https://github.com/codeofdusk/treemendous
  - Possible shortcuts:
    - Alt + a to add node
    - F2 or select "edit node" from context menu
  - Drawback: examples do not work
- Fancy Tree
  - See [relevant discussion](https://github.com/mar10/fancytree/issues/709)

### Analogous features with Excel 365 online editor
| IDE | Excel | Shortcut |
| ---- | ----- | ------- |
| Change IDE tab | Change Sheet | Ctrl + Page down / Option + Right arrow key |
| Access toolbar | Access menus | Alt-Q/etc. |
| Enter tree node | Go forward column | Right arrow key |
| Exit tree node | Go back one column | Left arrow key |
| Move through children | Move through cells | Up/down arrow keys |
| Edit the selected input | Edit the selected cell | F2 |
| Save selected input | Save selected cell | Enter? |
| Cancel changes to input | Cancel changes to cell | Esc? |

### Two ways of thinking of the editor 'tree'
1) The literal layout tree describing the AAC interface
2) The whole IDE
  - May or may not include tabs at the top as the initial children nodes
  - The layout tree is a subtree in the IDE
  - The html inputs are children of a layout node, and can themselves be trees (arranged hierarchically)
  - Editable html inputs are analogous to editable cells in Excel and serve as the leaf nodes

### Toolbar notes
Position:
- Under tab list
- Tab to get to/navigate from? 
- Save position in tree when accessing toolbar
Functionality:
- Add
- Edit

## Tab access (standards)
- [From w3.org](https://www.w3.org/WAI/ARIA/apg/example-index/tabs/tabs-manual.html)
- [From Mozilla web docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/tab_role)
