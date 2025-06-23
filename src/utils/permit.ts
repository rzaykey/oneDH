export type PermitType = 'read' | 'write' | 'full' | '';

export const canAdd = (permit: PermitType) =>
  permit === 'full' || permit === 'write';
export const canEdit = (permit: PermitType) =>
  permit === 'full' || permit === 'write';
export const canDelete = (permit: PermitType) => permit === 'full';
export const canRead = (permit: PermitType) => !!permit;

// Ambil permit untuk module tertentu, dari roles context
export const getModulePermit = (
  roles: any[],
  activeSite: string,
  module: string,
): PermitType => {
  const role = roles.find(
    r => r.code_site === activeSite && r.module === module,
  );
  return (role?.permit ?? '') as PermitType;
};
