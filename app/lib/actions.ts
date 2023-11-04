'use server'

import { signIn } from '@/auth'
import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', Object.fromEntries(formData));
  } catch (error) {
    if ((error as Error).message.includes('CredentialsSignin')) {
      return 'CredentialSignin';
    }
    throw error;
  }
}

const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = InvoiceSchema.omit({ id: true, date: true })

// Behind the scenes, Server Actions create a POST API endpoint.
// This is why you don't need to create API endpoints when using Server Actions.


export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

// prevState passed from the useFormState hook, not used here, but needed
export const createInvoice = async (prevState: State, formData: FormData) => {
  // 1. Validate form using Zod
  const result  = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })

  // 2. If form validation fails, return errors early. Otherwise, continue.
  if (!result.success) {
    // result= { success: false, error: [Getter] }
    console.log(result.error.flatten().fieldErrors)
    return {
      errors: result.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.'
    }
  }

  // 3. Prepare data for insertion into the db
  const { customerId, amount, status } = result.data
  const amountInCents = amount * 100
  const date = new Date().toISOString().split('T')[0] // '2023-10-31'

  // 4. Insert data into the db
  try {
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `
  } catch (error) {
    // If a db error occurs, return a more specific error.
    return {
      message: `Database Error: Failed to Create Invoice for customerId=${customerId}`,
    }
  }

  // 5. Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

// Use Zod to update the expected types
const UpdateInvoice = InvoiceSchema.omit({ date: true })

export const updateInvoice = async (id: string, prevState: State, formData: FormData) => {
  const result = UpdateInvoice.safeParse({
    id,
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.'
    }
  }

  const { customerId, amount, status } = result.data
  const amountInCents = amount * 100

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `
  } catch (error) {
    return {
      message: `Database Error: Failed to Update Invoice for customerId=${customerId}, invoiceId=${id}`,
    }
  }

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

export const deleteInvoice = async (id: string) => {
  try {
    await sql`
      DELETE FROM invoices
      WHERE id = ${id}
    `
  } catch (error) {
    return {
      message: `Database Error: Failed to Delete Invoice for invoiceId=${id}`,
    }
  }

  revalidatePath('/dashboard/invoices')
  return { message: 'Deleted Invoice.' }
}

/*
 errors type:
 {
    customerId?: string[] | undefined;
    amount?: string[] | undefined;
    status?: string[] | undefined;
}

result.error.flatten().fieldErrors for
empty form submitted:
{
  customerId: [ 'Please select a customer.' ],
  amount: [ 'Please enter an amount greater than $0.' ],
  status: [ 'Please select an invoice status.' ]
}

 select invoice status:
{
  customerId: [ 'Please select a customer.' ],
  amount: [ 'Please enter an amount greater than $0.' ]
}

 only not select customer:
{ customerId: [ 'Please select a customer.' ] }
 ○ Compiling /dashboard/invoices/page ...
 ✓ Compiled /dashboard/invoices/page in 1366ms (734 modules)



formData= FormData {
  [Symbol(state)]: [
    {
      name: 'customerId',
      value: '3958dc9e-787f-4377-85e9-fec4b6a6442a'
    },
    { name: 'amount', value: '101' },
    { name: 'status', value: 'pending' }
  ]
}


error if missing amount:

{errors: {…}, message: 'Missing Fields. Failed to Update Invoice.'}
errors
: 
amount
: 
Array(1)
0
: 
"Please enter an amount greater than $0."
length
: 
1
[[Prototype]]
: 
Array(0)
[[Prototype]]
: 
Object
message
: 
"Missing Fields. Failed to Update Invoice."
[[Prototype]]
: 
Object
*/
