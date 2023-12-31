import Form from '@/app/ui/invoices/edit-form'
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs'
import { fetchCustomers, fetchInvoiceById } from '@/app/lib/data'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

type Props = {
  params: { id: string }
}

export const metadata: Metadata = {
  title: 'Edit Invoice',
}

const UpdateInvoicePage = async ({ params }: Props) => {
  const { id } = params

  const [invoice, customers] = await Promise.all([
    fetchInvoiceById(id),
    fetchCustomers(),
  ])

  // console.log('id=', id, ' , invoice=', invoice)

  if (!invoice) {
    notFound()
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form
        invoice={invoice!}
        customers={customers}
      />
    </main>
  )
}

export default UpdateInvoicePage

/*
id= 88b297fe-4118-4ada-be58-a3ee89c33129  , invoice= {
  id: '88b297fe-4118-4ada-be58-a3ee89c33129',
  customer_id: '3958dc9e-742f-4377-85e9-fec4b6a6442a',
  amount: 3500,
  status: 'paid'
}
*/
