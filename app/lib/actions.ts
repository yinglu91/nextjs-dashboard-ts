'use server'

import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
})

const CreateInvoice = InvoiceSchema.omit({ id: true, date: true })

// Behind the scenes, Server Actions create a POST API endpoint.
// This is why you don't need to create API endpoints when using Server Actions.

export const createInvoice = async (formData: FormData) => {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })

  const amountInCents = amount * 100
  const date = new Date().toISOString().split('T')[0] // '2023-10-31'

  try {
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `
  } catch (error) {
    return {
      message: `Database Error: Failed to Create Invoice for customerId=${customerId}`,
    }
  }

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

// Use Zod to update the expected types
const UpdateInvoice = InvoiceSchema.omit({ date: true })

export const updateInvoice = async (id: string, formData: FormData) => {
  const { customerId, amount, status } = UpdateInvoice.parse({
    id,
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })

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
*/
