/**
 * AuditLogger Service
 * Centralized, append-only logger for all 20 system actions across Sarees, Beams, Combinations, Stock, Images, and WhatsApp.
 */
const { supabase } = require('../config/supabase');

/**
 * List of supported action types & colors
 */
const ACTION_TYPES = {
  STOCK_RECEIVED:         { type: 'Stock',                 category: 'Stock',      color: 'Green' },
  STOCK_DELIVERY:         { type: 'Stock Delivery',        category: 'Outflow',    color: 'Orange' },
  DELIVERY_MACHINE:       { type: 'Delivery',              category: 'Machine',    color: 'Blue' },
  RETURN:                 { type: 'Return',                category: 'Inflow',     color: 'Purple' },
  DAMAGE:                 { type: 'Damage',                category: 'Loss',       color: 'Red' },
  TRANSFER:               { type: 'Transfer',              category: 'Movement',   color: 'Blue' },
  MANUAL_ADJUSTMENT:      { type: 'Manual Adjustment',     category: 'Edit',       color: 'Yellow' },
  WHATSAPP_IMPORT:        { type: 'WhatsApp Import',       category: 'Import',     color: 'WhatsApp Green' },
  WHATSAPP_STOCK_REQUEST: { type: 'WhatsApp Stock Request', category: 'Request',    color: 'WhatsApp Green' },
  PURCHASE_REQUEST:       { type: 'Purchase Request Created', category: 'Request', color: 'Blue' },
  PURCHASE_RECEIVED:      { type: 'Purchase Received',     category: 'Stock',      color: 'Green' },
  COMBO_CREATED:          { type: 'Combination Created',   category: 'System',     color: 'Blue' },
  COMBO_EDITED:           { type: 'Combination Edited',    category: 'System',     color: 'Yellow' },
  COMBO_DELETED:          { type: 'Combination Deleted',   category: 'System',     color: 'Red' },
  IMAGE_UPLOADED:         { type: 'Image Uploaded',        category: 'Media',      color: 'Blue' },
  IMAGE_REPLACED:         { type: 'Image Replaced',        category: 'Media',      color: 'Yellow' },
  IMAGE_DELETED:          { type: 'Image Deleted',         category: 'Media',      color: 'Red' },
  ROLLBACK:               { type: 'Rollback',              category: 'Audit',      color: 'Gray' },
  IMPORT_FAILED:          { type: 'Import Failed',         category: 'Error',      color: 'Red' },
  DUPLICATE_UPDATED:      { type: 'Duplicate Updated',     category: 'Import',     color: 'Orange' },
};

/**
 * Permanent Audit Log Entry Creator
 */
const logAuditTrail = async ({
  ownerId,
  userId,
  userName,
  actionType, // Key from ACTION_TYPES or exact string
  sareeId = null,
  seriesCode = null,
  beamName = null,
  combinationId = null,
  combinationName = null,
  oldStock = 0,
  newStock = 0,
  imageUrl = null,
  reason = '',
  supplierId = null,
  supplierName = null,
  customerName = null,
  machineName = null,
  invoiceNumber = null,
  whatsappMessage = null,
  status = 'completed',
  metadata = {}
}) => {
  try {
    const actConfig = ACTION_TYPES[actionType] || { type: actionType, category: 'General', color: 'Gray' };
    
    // Construct rich details object for backward compatibility & deep drawer view
    const details = {
      action_type: actConfig.type,
      action_category: actConfig.category,
      action_color: actConfig.color,
      sari_number: seriesCode,
      beam_name: beamName,
      combination_name: combinationName,
      image_url: imageUrl,
      opening_stock: oldStock,
      closing_stock: newStock,
      quantity_changed: newStock - oldStock,
      reason,
      supplier_id: supplierId,
      supplier_name: supplierName,
      customer_name: customerName,
      machine_name: machineName,
      invoice_number: invoiceNumber,
      whatsapp_message: whatsappMessage,
      user_name: userName,
      status,
      ...metadata
    };

    const { data, error } = await supabase.from('stock_history').insert({
      owner_id: ownerId,
      saree_id: sareeId,
      combination_id: combinationId,
      beam_name: beamName,
      combination_name: combinationName,
      old_stock: oldStock,
      new_stock: newStock,
      action: actConfig.type,
      action_type: actConfig.type,
      image_url: imageUrl,
      supplier_id: supplierId,
      supplier_name: supplierName,
      customer_name: customerName,
      machine_name: machineName,
      invoice_number: invoiceNumber,
      whatsapp_message: whatsappMessage,
      status,
      reason: JSON.stringify(details),
      changed_by: userId,
      changed_by_name: userName,
      metadata: details
    }).select().single();

    if (error) console.error('Error recording audit ledger:', error);
    return data;
  } catch (err) {
    console.error('AuditLogger Exception:', err);
    return null;
  }
};

module.exports = {
  ACTION_TYPES,
  logAuditTrail
};
