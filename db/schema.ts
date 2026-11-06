import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';
export const financialVersions=sqliteTable('financial_versions',{record:text('record_id').primaryKey().references(()=>records.id),version:integer('version').notNull().default(0)});
export const financialOperations=sqliteTable('financial_operations',{id:text('id').primaryKey(),actor:text('actor').notNull(),record:text('record_id').notNull().references(()=>records.id),fingerprint:text('fingerprint').notNull(),result:text('result').notNull(),created:text('created').notNull()});
export const ingestionJobs=sqliteTable('ingestion_jobs',{id:text('id').primaryKey(),group:text('group_id').notNull(),sender:text('sender_id').notNull(),status:text('status').notNull().default('queued'),attempts:integer('attempts').notNull().default(0),available:integer('available').notNull(),lease:text('lease'),leaseUntil:integer('lease_until').notNull().default(0),payload:text('payload_key').notNull(),cache:text('cache_key'),error:text('error'),created:text('created').notNull(),updated:text('updated').notNull()},t=>[index('ingestion_jobs_due').on(t.status,t.available)]);
export const maintenanceLocks=sqliteTable('maintenance_locks',{id:text('id').primaryKey(),owner:text('owner').notNull(),expires:integer('expires').notNull()});
export const users = sqliteTable('users',{id:text('id').primaryKey(),name:text('name').notNull(),email:text('email').notNull().unique(),identity:text('identity').unique(),role:text('role').notNull(),active:integer('active').notNull().default(1),projects:text('projects').notNull().default('[]')});
export const supabaseUserBindings = sqliteTable('supabase_user_bindings', {
 subject: text('subject').primaryKey(),
 user: text('user_id').notNull().unique().references(() => users.id),
 created: text('created').notNull()
});
export const projects = sqliteTable('projects',{id:text('id').primaryKey(),name:text('name').notNull(),code:text('code').notNull().unique(),address:text('address').notNull(),status:text('status').notNull().default('active'),created:text('created').notNull()});
export const suppliers = sqliteTable('suppliers',{id:text('id').primaryKey(),name:text('name').notNull(),contact:text('contact').notNull()});
export const categories = sqliteTable('categories',{id:text('id').primaryKey(),name:text('name').notNull()});
export const records = sqliteTable('records',{id:text('id').primaryKey(),project:text('project').notNull().references(()=>projects.id),author:text('author').notNull().references(()=>users.id),description:text('description').notNull(),amount:integer('amount'),type:text('type').notNull(),category:text('category').notNull(),supplier:text('supplier'),date:text('date').notNull(),status:text('status').notNull(),payment:text('payment').notNull().default('unreported'),created:text('created').notNull()});
export const audit = sqliteTable('audit',{id:text('id').primaryKey(),actor:text('actor').notNull(),action:text('action').notNull(),entity:text('entity').notNull(),before:text('before'),after:text('after'),created:text('created').notNull()});
export const attachments = sqliteTable('attachments',{id:text('id').primaryKey(),record:text('record').notNull().references(()=>records.id),name:text('name').notNull(),mime:text('mime').notNull(),size:integer('size').notNull(),hash:text('hash').notNull(),actor:text('actor').notNull(),created:text('created').notNull()});
export const whatsappGroups = sqliteTable('whatsapp_groups',{id:text('id').primaryKey(),project:text('project').notNull().references(()=>projects.id),active:integer('active').notNull().default(1)});
export const whatsappSenders = sqliteTable('whatsapp_senders',{id:text('id').primaryKey(),user:text('user').notNull().references(()=>users.id)});
export const whatsappMessages = sqliteTable('whatsapp_messages',{id:text('id').primaryKey(),group:text('group_id').notNull(),sender:text('sender_id').notNull(),kind:text('kind').notNull(),status:text('status').notNull(),record:text('record_id'),received:text('received').notNull(),question:text('question'),correlation:text('correlation').notNull(),document:text('document')},t=>[index('whatsapp_messages_group_received').on(t.group,t.received)]);
export const whatsappGroupDirectory=sqliteTable('whatsapp_group_directory',{id:text('id').primaryKey(),name:text('name').notNull(),seen:text('seen').notNull()});
export const whatsappGroupSettings=sqliteTable('whatsapp_group_settings',{group:text('group_id').primaryKey().references(()=>whatsappGroups.id),mode:text('mode').notNull().default('project'),updated:text('updated').notNull()});
export const whatsappGroupMembers=sqliteTable('whatsapp_group_members',{group:text('group_id').notNull(),sender:text('sender_id').notNull(),phone:text('phone').notNull().default(''),name:text('name').notNull().default(''),seen:text('seen').notNull()},t=>[primaryKey({columns:[t.group,t.sender]})]);
export const whatsappGroupSenders=sqliteTable('whatsapp_group_senders',{group:text('group_id').notNull().references(()=>whatsappGroups.id),sender:text('sender_id').notNull().references(()=>whatsappSenders.id)},t=>[primaryKey({columns:[t.group,t.sender]})]);
export const whatsappConnection = sqliteTable('whatsapp_connection',{id:text('id').primaryKey(),state:text('state').notNull(),updated:text('updated').notNull()});
export const whatsappReceipts = sqliteTable('whatsapp_receipts',{
 id:text('id').primaryKey(),message:text('message_id').notNull().unique().references(()=>whatsappMessages.id),
 author:text('author').notNull().references(()=>users.id),mime:text('mime').notNull(),size:integer('size').notNull(),hash:text('hash').notNull(),caption:text('caption').notNull(),
 received:text('received').notNull(),status:text('status').notNull().default('pending'),record:text('record_id').references(()=>records.id),reviewer:text('reviewer').references(()=>users.id)
});
