import type * as p from "@bokehjs/core/properties"
import {Column as BkColumn, ColumnView as BkColumnView} from "@bokehjs/models/layouts/column"
import {div, button} from "@bokehjs/core/dom"
import {ModelEvent, server_event} from "@bokehjs/core/bokeh_events"
import type {Attrs} from "@bokehjs/core/types"

//type A11yDialogView = {
//  addSignalListener(event: unknown, listener: unknown): void
//  finalize(): void
//  on(event: string, listener: () => void): void
//  new
//}
//
//type A11yDialog = (container: HTMLElement, embed_data: unknown, config: unknown) => Promise<{view: A11yDialogView}>
//declare const A11yDialog: A11yDialog

@server_event("modal-dialog-event")
export class ModalDialogEvent extends ModelEvent {
  open: boolean

  constructor(open: boolean) {
    super()
    this.open = open
  }

  protected override get event_values(): Attrs {
    return {open: this.open}
  }

  static override from_values(values: object) {
    const {open} = values as {open: boolean}
    return new ModalDialogEvent(open)
  }
}

export class ModalView extends BkColumnView {
  declare model: Modal

  modal: any
  close_button: HTMLButtonElement
  modal_children: HTMLElement

  override connect_signals(): void {
    super.connect_signals()
    const {children, show_close_button} = this.model.properties
    this.on_change([children], this.update)
    this.on_change([show_close_button], this.update_close_button)
    this.model.on_event(ModalDialogEvent, (event) => {
      if (event.open) {
        this.modal.show()
      } else {
        this.modal.hide()
      }
    })
  }

  override render(): void {
    super.render()
    const container = div({style: {display: "contents"}})
    const dialog = div({
      id: "pnx_dialog",
      class: "dialog-container bk-root",
      "aria-hidden": "true",
    } as any)
    const dialog_overlay = div({
      class: "dialog-overlay",
      "data-a11y-dialog-hide": "",
    } as any)
    const content = div({
      id: "pnx_dialog_content",
      class: "dialog-content",
      role: "document",
    } as any)
    this.close_button = button({
      content: "Close",
      id: "pnx_dialog_close",
      "data-a11y-dialog-hide": "",
      class: "pnx-dialog-close",
      ariaLabel: "Close this dialog window",
    } as any)
    this.modal_children = div({id: "pnx_modal_object"})

    container.append(dialog)
    dialog.append(dialog_overlay)
    dialog.append(content)
    content.append(this.close_button)
    content.append(this.modal_children)
    this.shadow_el.append(container)

    this.modal = new (window as any).A11yDialog(dialog)
    this.update()
    this.modal.on("show", () => { this.model.is_open = true })
    this.modal.on("hide", () => { this.model.is_open = false })
  }

  update(): void {
    // TODO: clear old children
    for (const child of this.children()) {
      // FIXME: remove any and look into better method
      this.modal_children.append((child as any).el)
    }
    this.update_close_button()
  }

  update_close_button(): void {
    if (this.model.show_close_button) {
      this.close_button.style.display = "block"
    } else {
      this.close_button.style.display = "none"
    }
  }
}

export namespace Modal {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BkColumn.Props & {
    is_open: p.Property<boolean>
    show_close_button: p.Property<boolean>
  }
}

export interface Modal extends Modal.Attrs {}

export class Modal extends BkColumn {
  declare properties: Modal.Props

  constructor(attrs?: Partial<Modal.Attrs>) {
    super(attrs)
  }

  static override __module__ = "panel.models.layout"
  static {
    this.prototype.default_view = ModalView
    this.define<Modal.Props>(({Bool}) => ({
      is_open: [Bool, false],  // TODO: read-only
      show_close_button: [Bool, true],
    }))
  }
}
