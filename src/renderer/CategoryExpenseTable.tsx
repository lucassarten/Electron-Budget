/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
import { useCallback, useEffect, useMemo, useState } from 'react';
import MaterialReactTable, {
  MRT_Cell,
  MRT_ColumnDef,
  MRT_RowSelectionState,
} from 'material-react-table';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';

import { buttonStyleAdd, buttonStyleCancel } from './styles/MUI';

import { Category } from './Types';

const validateRequired = (value: string) => !!value.length;
const formatCurrency = (value: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'NZD',
    currencyDisplay: 'symbol',
  });
  return formatter.format(value);
};
const validateAmount = (value: string) => {
  const number = Number(value);
  return !Number.isNaN(number) && number >= 0;
};

interface CreateModalProps {
  columns: MRT_ColumnDef<Category>[];
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onSubmit: (values: Category) => void;
  open: boolean;
}

export function AddCategoryModal({
  open,
  columns,
  onClose,
  onSubmit,
}: CreateModalProps) {
  const [values, setValues] = useState<any>(() =>
    columns.reduce((acc, column) => {
      acc[column.accessorKey ?? ''] = '';
      return acc;
    }, {} as any)
  );

  const handleSubmit = () => {
    // put your validation logic here
    onSubmit(values);
    onClose();
  };

  return (
    <Dialog open={open}>
      <DialogTitle textAlign="center">Add Expense Category</DialogTitle>
      <DialogContent>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="add-category-form"
        >
          <Stack
            sx={{
              width: '100%',
              minWidth: { xs: '300px', sm: '360px', md: '400px' },
              gap: '1.5rem',
            }}
          >
            {columns.slice(0, 1).map((column) => (
              <TextField
                key={column.accessorKey}
                label={column.header}
                name={column.accessorKey}
                onChange={(e) =>
                  setValues({ ...values, [e.target.name]: e.target.value })
                }
                required
                error={!validateRequired(values.name)}
              />
            ))}
            {columns.slice(1).map((column) => (
              <TextField
                key={column.accessorKey}
                label={column.header}
                name={column.accessorKey}
                onChange={(e) =>
                  setValues({ ...values, [e.target.name]: e.target.value })
                }
                required
                error={!validateAmount(values.target)}
                helperText={
                  !validateAmount(values.target)
                    ? `${column.accessorKey} must be a positive number`
                    : ''
                }
              />
            ))}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: '1.25rem' }}>
        <Button onClick={onClose} style={buttonStyleCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          style={
            !validateAmount(values.target) ||
            !validateRequired(values.target) ||
            !validateRequired(values.name)
              ? buttonStyleAdd.disabled
              : buttonStyleAdd
          }
          // inactive if there are validation errors
          disabled={
            !validateAmount(values.target) ||
            !validateRequired(values.target) ||
            !validateRequired(values.name)
          }
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CategoryExpenseTable() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState<Category[]>([]);
  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string;
  }>({});
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  useEffect(() => {
    window.electron.ipcRenderer.once('db-query-categories-expense', (resp) => {
      const response = resp as Category[];
      setTableData(response);
    });
    // get categories from db
    window.electron.ipcRenderer.sendMessage('db-query', [
      'db-query-categories-expense',
      `SELECT * FROM CategoriesExpense`,
    ]);
  }, []);

  const handleCreateNewRow = (values: Category) => {
    tableData.push(values);
    // insert row into db
    window.electron.ipcRenderer.sendMessage('db-query', [
      '',
      `INSERT INTO CategoriesExpense (name, target) VALUES ('${values.name}', ${values.target})`,
    ]);
    setTableData([...tableData]);
  };

  const handleSaveCell = useCallback(
    (cell: MRT_Cell<Category>, value: any) => {
      // there is probably a better way to do this
      switch (cell.column.id) {
        case 'name':
          tableData[cell.row.index].name = value;
          break;
        case 'target':
          tableData[cell.row.index].target = value;
          break;
        default:
          break;
      }
      // update row in db
      window.electron.ipcRenderer.sendMessage('db-query', [
        '',
        `UPDATE CategoriesExpense SET name = '${
          tableData[cell.row.index].name
        }', target = ${tableData[cell.row.index].target} WHERE name = '${
          tableData[cell.row.index].name
        }'`,
      ]);
      setTableData([...tableData]);
    },
    [tableData]
  );

  const handleDeleteRows = useCallback(() => {
    // loop through selected rows and delete them from tableData
    const newTableData = tableData.filter((row) => !rowSelection[row.name]);
    console.log(rowSelection);
    // delete rows from db
    const query = `DELETE FROM CategoriesIncome WHERE name IN (${Object.keys(
      rowSelection
    )
      .map((key) => `"${key}"`)
      .join(', ')})`;

    console.log(query);
    window.electron.ipcRenderer.sendMessage('db-query', ['', query]);
    setTableData(newTableData);
    setRowSelection({});
  }, [rowSelection, tableData]);

  const getCommonEditTextFieldProps = useCallback(
    (
      cell: MRT_Cell<Category>
    ): MRT_ColumnDef<Category>['muiTableBodyCellEditTextFieldProps'] => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onFocus: () => {
          delete validationErrors[cell.id];
          setValidationErrors({
            ...validationErrors,
          });
        },
        onChange: (event) => {
          const isValid =
            cell.column.id === 'target'
              ? validateAmount(event.target.value)
              : cell.column.id === 'name'
              ? validateRequired(event.target.value)
              : true;
          if (!isValid) {
            // set validation error for cell if invalid
            setValidationErrors({
              ...validationErrors,
              [cell.id]: `${cell.column.columnDef.header} is invalid`,
            });
          } else {
            // remove validation error for cell if valid
            delete validationErrors[cell.id];
            setValidationErrors({
              ...validationErrors,
            });
          }
        },
        onBlur: (event) => {
          const isValid =
            cell.column.id === 'target'
              ? validateAmount(event.target.value)
              : cell.column.id === 'name'
              ? validateRequired(event.target.value)
              : true;
          if (!isValid) {
            // set validation error for cell if invalid
            setValidationErrors({
              ...validationErrors,
              [cell.id]: `${cell.column.columnDef.header} is invalid`,
            });
          } else {
            // remove validation error for cell if valid
            delete validationErrors[cell.id];
            setValidationErrors({
              ...validationErrors,
            });
            handleSaveCell(cell, event.target.value);
          }
        },
      };
    },
    [handleSaveCell, validationErrors]
  );

  const columns = useMemo<MRT_ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'name',
        size: 100,
        // date picker
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: 'target',
        header: 'target',
        size: 50,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
        // format as currency
        Cell: ({ cell }) => formatCurrency(cell.getValue() as number),
      },
    ],
    [getCommonEditTextFieldProps]
  );

  return (
    <div className="targets-table">
      <MaterialReactTable
        muiTableContainerProps={
          {
            style: {
              maxHeight: 'calc(100vh - 150px)',
            },
          } as any
        }
        enableBottomToolbar={false}
        enableStickyHeader
        enablePagination={false}
        columns={columns}
        data={tableData}
        editingMode="table"
        enableEditing
        enableRowSelection
        onRowSelectionChange={setRowSelection}
        state={{ rowSelection }}
        getRowId={(row) => row.name}
        renderTopToolbarCustomActions={() => (
          <span className="table-top-toolbar-container">
            <button
              className="button-add-category"
              type="button"
              onClick={() => setCreateModalOpen(true)}
            >
              Add
            </button>
            <button
              className="button-delete-category"
              type="button"
              disabled={Object.keys(rowSelection).length === 0}
              onClick={() => handleDeleteRows()}
            >
              Delete
            </button>
            <h2>Expense</h2>
          </span>
        )}
      />
      <AddCategoryModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />
    </div>
  );
}

export default CategoryExpenseTable;
