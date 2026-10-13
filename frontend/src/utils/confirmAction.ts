import { ElMessageBox } from 'element-plus'

type ConfirmActionOptions = {
  title: string
  confirmText: string
  cancelText: string
  danger?: boolean
}

export async function confirmAction(
  message: string,
  options: ConfirmActionOptions,
): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, options.title, {
      type: options.danger ? 'warning' : 'info',
      confirmButtonText: options.confirmText,
      cancelButtonText: options.cancelText,
      confirmButtonClass: options.danger ? 'el-button--danger' : '',
      closeOnClickModal: false,
      closeOnPressEscape: true,
      distinguishCancelAndClose: true,
    })
    return true
  } catch {
    return false
  }
}
