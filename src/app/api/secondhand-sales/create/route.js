import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";


import { getUserFromRequest } from "@/lib/auth";

// Helper function to calculate all values for an item
const calculateItemValues = (item) => {
    const unitPrice = parseFloat(item.unit_price);
    const quantity = parseFloat(item.quantity);
    const gstRate = parseFloat(item.gst_rate || 0);

    const amount = unitPrice * quantity;

    let discountAmount = 0;
    if (item.discount && item.discount !== '') {
        const discountStr = item.discount.toString().trim();
        if (discountStr.endsWith('%')) {
            const percentage = parseFloat(discountStr.replace('%', ''));
            if (!isNaN(percentage)) {
                discountAmount = (amount * percentage) / 100;
            }
        } else {
            const discountValue = parseFloat(discountStr);
            discountAmount = isNaN(discountValue) ? 0 : discountValue;
        }
    }

    const amount_after_discount = amount - discountAmount;
    const gst_amount = (amount_after_discount * gstRate) / 100;
    const goods_service_total_amount = amount_after_discount + gst_amount;

    return {
        amount,
        discountAmount,
        amount_after_discount,
        gst_amount,
        goods_service_total_amount,
        gstRate
    };
};

// SIMPLIFIED Inventory management function - FIXED
const updateInventory = async (tx, item, organizationId, userId, isUpdate = false, oldQuantity = 0) => {
    const itemType = item.sales_item_type; // 'GOODS' or 'SERVICE'
    const itemId = itemType === 'GOODS' ? parseInt(item.goods_services_id) : parseInt(item.goods_services_id);
    const unitId = parseInt(item.unit_of_measurement_id);
    const purchasePrice = parseFloat(item.exiting_price); // Purchase price (cost price, e.g., 100)
    const quantity = parseFloat(item.quantity); // Quantity to reduce

    console.log('Updating inventory for:', {
        itemType,
        itemId,
        unitId,
        purchasePrice,
        quantity,
        organizationId
    });

    // Check if inventory already exists for this item
    const existingInventory = await tx.inventoryMaster.findFirst({
        where: {
            organization_id: organizationId,
            unit_id: unitId,
            price: purchasePrice, // Match by PURCHASE price (cost price)
            OR: [
                { goods_id: itemType === 'GOODS' ? itemId : null },
                { service_id: itemType === 'SERVICE' ? itemId : null }
            ]
        }
    });

    console.log('Found inventory:', existingInventory);

    if (!existingInventory) {
        throw new Error(`Inventory not found for ${item.goods_service_name || 'item'} with purchase price ${purchasePrice}. Cannot process sale.`);
    }

    // Parse existing qty as decimal
    const existingQty = parseFloat(existingInventory.qty);
    console.log('Existing quantity:', existingQty);

    // For sales, we REDUCE the inventory quantity
    let newQty;

    if (isUpdate) {
        // For update operation: calculate the difference
        const quantityDiff = quantity - oldQuantity;
        // Since we're reducing inventory, if quantity increased, we reduce more from inventory
        // If quantity decreased, we add back to inventory
        newQty = existingQty - quantityDiff; // Note: subtracting the difference
    } else {
        // For create operation: reduce inventory by quantity
        newQty = existingQty - quantity;
    }

    console.log('New quantity will be:', newQty);

    // Check if new quantity would go negative
    if (newQty < 0) {
        throw new Error(`Insufficient inventory for ${item.goods_service_name || 'item'}. Current stock: ${existingQty}, attempted to sell: ${quantity}`);
    }

    const newInventoryAmount = newQty * purchasePrice; // Use PURCHASE price for inventory value

    console.log('Updating inventory with:', {
        id: existingInventory.id,
        qty: newQty,
        inventory_amount: newInventoryAmount
    });

    const result = await tx.inventoryMaster.update({
        where: { id: existingInventory.id },
        data: {
            qty: newQty,
            inventory_amount: newInventoryAmount,
            updated_at: new Date(),
        }
    });

    console.log('Inventory updated result:', result);
    return result;
};

// Helper function to create customer
const createCustomer = async (customerData, partyType, organizationId) => {
    try {
        const {
            name,
            cid,
            taxPayerRegNo,
            taxPayerRegion,
            email,
            phone,
            taxPayerRegStatus = 'NO',
            // For other party types
            businessName,
            licenseNo,
            companyRegistrationNo,
            agencyName,
            corporationName,
            csoName,
            csoRegistrationNo
        } = customerData;

        // Validate required fields
        if (!name && !businessName && !agencyName && !corporationName && !csoName) {
            throw new Error('Customer name is required');
        }

        // First create party record
        const party = await prisma.Party.create({
            data: {
                partyType: partyType,
                organizationId: organizationId,
                status: 'A'
            }
        });

        let customerDetails = {};

        switch (partyType) {
            case 'INDIVIDUAL':
                const individualParty = await prisma.IndividualParty.create({
                    data: {
                        partyId: party.partyId,
                        cid: cid || null,
                        name: name,
                        taxPayerRegStatus: taxPayerRegNo ? 'YES' : 'NO',
                        taxPayerRegNo: taxPayerRegNo || null,
                        taxPayerRegion: taxPayerRegion || null,
                        email: email || null,
                        phone: phone || null
                    }
                });
                customerDetails = {
                    partyId: party.partyId,
                    name: individualParty.name,
                    cid: individualParty.cid,
                    taxPayerRegNo: individualParty.taxPayerRegNo,
                    taxPayerRegion: individualParty.taxPayerRegion,
                    email: individualParty.email,
                    phone: individualParty.phone
                };
                break;

            case 'BUSINESS':
                const businessParty = await prisma.BusinessParty.create({
                    data: {
                        partyId: party.partyId,
                        licenseNo: licenseNo || null,
                        businessName: businessName || name,
                        companyRegistrationNo: companyRegistrationNo || null,
                        taxPayerRegStatus: taxPayerRegStatus || 'NO',
                        taxPayerRegNo: taxPayerRegNo || null,
                        taxPayerRegion: taxPayerRegion || null,
                        address: customerData.address || null,
                        officeEmail: email || null,
                        officePhone: phone || null
                    }
                });
                customerDetails = {
                    partyId: party.partyId,
                    name: businessParty.businessName,
                    licenseNo: businessParty.licenseNo,
                    taxPayerRegNo: businessParty.taxPayerRegNo,
                    companyRegistrationNo: businessParty.companyRegistrationNo
                };
                break;

            case 'CORPORATION':
                const corporationParty = await prisma.CorporationParty.create({
                    data: {
                        partyId: party.partyId,
                        corporationName: corporationName || name,
                        taxPayerRegStatus: taxPayerRegStatus || 'NO',
                        taxPayerRegNo: taxPayerRegNo || null,
                        taxPayerRegion: taxPayerRegion || null,
                        address: customerData.address || null,
                        officeEmail: email || null,
                        officePhone: phone || null
                    }
                });
                customerDetails = {
                    partyId: party.partyId,
                    name: corporationParty.corporationName,
                    taxPayerRegNo: corporationParty.taxPayerRegNo
                };
                break;

            default:
                throw new Error(`Unsupported party type: ${partyType}`);
        }

        return customerDetails;

    } catch (error) {
        console.error('Error creating customer:', error);
        throw error;
    }
};

export async function POST(req) {
    try {
        // Get organizationId from JWT token
        const organizationId = await getOrganizationIdFromRequest(req);

        const user = await getUserFromRequest(req);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!organizationId) {
            return Response.json({
                success: false,
                error: "Unauthorized: Organization ID not found in token"
            }, { status: 401 });
        }

        const body = await req.json();

        // Log activity
        try {
            const user = await getUserFromRequest(req);

            if (user?.id) {
                const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
                const userAgent = req.headers.get('user-agent') || 'unknown';
                const pathname = req.nextUrl.pathname;
                const method = req.method;

                const { default: prisma } = await import('@/lib/prisma');

                await prisma.activityLog.create({
                    data: {
                        userId: user.id,
                        action: 'CREATE',  //CREATE, UPDATE, DELETE
                        module: pathname.split('/')[2] || 'unknown',
                        description: `${method} ${pathname}`,
                        ipAddress,
                        userAgent,
                        payload: body,
                    },
                });
            }
        } catch (logError) {
            console.error('Activity logging failed:', logError);
        }
        const {
            customer_id,
            currency,
            customer_tpn,
            customer_name,
            sales_date,
            items,
            created_by,
            status = "IP",
            // New fields for customer creation
            create_new_customer = false,
            new_customer_data = null,
            party_type = 'INDIVIDUAL',
            // Payment fields
            payment_mode,
            transaction_id,
            cheque_number,
            journal_number,
            bank_name
        } = body;

        console.log('Received payload:', body);

        let finalCustomerId = customer_id;
        let finalCustomerName = customer_name;
        let finalCustomerTpn = customer_tpn;

        // Check if we need to create a new customer
        if (create_new_customer && new_customer_data) {
            try {
                const newCustomer = await createCustomer(new_customer_data, party_type, organizationId);
                finalCustomerId = newCustomer.partyId;
                finalCustomerName = newCustomer.name;
                finalCustomerTpn = newCustomer.taxPayerRegNo;

                console.log('Created new customer:', {
                    id: finalCustomerId,
                    name: finalCustomerName,
                    tpn: finalCustomerTpn,
                    type: party_type
                });
            } catch (error) {
                return Response.json({
                    success: false,
                    error: `Failed to create customer: ${error.message}`
                }, { status: 400 });
            }
        }

        // Validate customer_id exists
        if (!finalCustomerId) {
            return Response.json({
                success: false,
                error: "Customer ID is required"
            }, { status: 400 });
        }

        // Check if customer exists
        const existingCustomer = await prisma.Party.findUnique({
            where: { partyId: parseInt(finalCustomerId) },
            include: {
                individualParty: true,
                businessParty: true,
                governmentAgencyParty: true,
                corporationParty: true,
                csoParty: true
            }
        });

        if (!existingCustomer) {
            return Response.json({
                success: false,
                error: "Customer not found"
            }, { status: 400 });
        }

        // Get customer name from the appropriate table
        if (!finalCustomerName) {
            if (existingCustomer.partyType === 'INDIVIDUAL' && existingCustomer.individualParty) {
                finalCustomerName = existingCustomer.individualParty.name;
            } else if (existingCustomer.partyType === 'BUSINESS' && existingCustomer.businessParty) {
                finalCustomerName = existingCustomer.businessParty.businessName;
            } else if (existingCustomer.partyType === 'GOVERNMENT_AGENCY' && existingCustomer.governmentAgencyParty) {
                finalCustomerName = existingCustomer.governmentAgencyParty.agencyName;
            } else if (existingCustomer.partyType === 'CORPORATION' && existingCustomer.corporationParty) {
                finalCustomerName = existingCustomer.corporationParty.corporationName;
            } else if (existingCustomer.partyType === 'CSO' && existingCustomer.csoParty) {
                finalCustomerName = existingCustomer.csoParty.csoName;
            }
        }

        // Get TPN from the appropriate table
        if (!finalCustomerTpn) {
            if (existingCustomer.individualParty) {
                finalCustomerTpn = existingCustomer.individualParty.taxPayerRegNo;
            } else if (existingCustomer.businessParty) {
                finalCustomerTpn = existingCustomer.businessParty.taxPayerRegNo;
            } else if (existingCustomer.governmentAgencyParty) {
                finalCustomerTpn = existingCustomer.governmentAgencyParty.taxPayerRegNo;
            } else if (existingCustomer.corporationParty) {
                finalCustomerTpn = existingCustomer.corporationParty.taxPayerRegNo;
            } else if (existingCustomer.csoParty) {
                finalCustomerTpn = existingCustomer.csoParty.taxPayerRegNo;
            }
        }

        // Validate items exist
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            include: {
                businessDetails: true,
                governmentAgencyDetail: true,
                corporationDetail: true,
                csoDetail: true,
            }
        });

        if (!organization) {
            return Response.json({
                success: false,
                error: "Organization not found"
            }, { status: 400 });
        }

        //org code
        let code = null;
        switch (organization.orgType) {
            case "business":
                code = organization.businessDetails.businessNameCode;
                break;
            case "government":
                code = organization.governmentAgencyDetail.agencyCode;
                break;
            case "corporation":
                code = organization.corporationDetail.organizationCode;
                break;
            case "cso":
                code = organization.csoDetail.agencyCode;
                break;
            default:
                throw new Error("Invalid organization type");
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return Response.json({
                success: false,
                error: "At least one item is required"
            }, { status: 400 });
        }

        // Validate and prepare items with inventory check
        let sales_amount = 0;
        let exempt_amount = 0;
        let taxable_amount = 0;
        const inventoryUpdates = [];

        const calculatedItems = await Promise.all(items.map(async (item) => {
            // Validate required fields
            if (!item.unit_price || !item.quantity || !item.sales_item_type || !item.goods_services_id || !item.unit_of_measurement_id) {
                throw new Error(`All item fields are required: unit_price, quantity, sales_item_type, goods_services_id, unit_of_measurement_id`);
            }

            const unitPrice = parseFloat(item.unit_price);
            const quantity = parseFloat(item.quantity);
            const gstRate = parseFloat(item.gst_rate || 0);
            const exiting_price = parseFloat(item.exiting_price);

            if (isNaN(unitPrice) || isNaN(quantity) || unitPrice <= 0 || quantity <= 0) {
                throw new Error(`Invalid unit price or quantity`);
            }

            // Check if goods/service exists and get details
            let goodsDetails = null;
            let serviceDetails = null;

            if (item.sales_item_type === 'GOODS') {
                goodsDetails = await prisma.goodsCatalog.findUnique({
                    where: { goodsId: parseInt(item.goods_services_id) }
                });
                if (!goodsDetails) {
                    throw new Error(`Goods with ID ${item.goods_services_id} not found`);
                }
            } else {
                serviceDetails = await prisma.serviceCatalog.findUnique({
                    where: { service_id: parseInt(item.goods_services_id) }
                });
                if (!serviceDetails) {
                    throw new Error(`Service with ID ${item.goods_services_id} not found`);
                }
            }

            // Check inventory availability before proceeding
            const existingInventory = await prisma.inventoryMaster.findFirst({
                where: {
                    organization_id: organizationId,
                    unit_id: parseInt(item.unit_of_measurement_id),
                    price: exiting_price, // Use exiting_price (purchase price)
                    OR: [
                        { goods_id: item.sales_item_type === 'GOODS' ? parseInt(item.goods_services_id) : null },
                        { service_id: item.sales_item_type === 'SERVICE' ? parseInt(item.goods_services_id) : null }
                    ]
                }
            });

            if (!existingInventory) {
                throw new Error(`No inventory found for ${item.sales_item_type === 'GOODS' ? 'goods' : 'service'} ID ${item.goods_services_id} with price ${exiting_price}`);
            }

            console.log('Inventory found:', {
                id: existingInventory.id,
                qty: existingInventory.qty,
                price: existingInventory.price
            });

            if (parseFloat(existingInventory.qty) < quantity) {
                throw new Error(`Insufficient inventory for ${item.goods_service_name || item.sales_item_type}. Available: ${existingInventory.qty}, Requested: ${quantity}`);
            }

            // Calculate all item values
            const itemValues = calculateItemValues(item);

            // Update sales totals
            sales_amount += itemValues.amount_after_discount;

            // Check if exempt (GST rate = 0)
            if (gstRate === 0) {
                exempt_amount += itemValues.amount_after_discount;
            } else {
                taxable_amount += itemValues.amount_after_discount;
            }

            // Store inventory update info - ADD exiting_price to item for updateInventory function
            const itemWithPurchasePrice = {
                ...item,
                exiting_price: exiting_price
            };

            inventoryUpdates.push({
                item: itemWithPurchasePrice, // Pass item with exiting_price
                quantity,
                existingInventoryId: existingInventory.id
            });

            // Prepare item data
            const itemData = {
                sales_item_type: item.sales_item_type,
                inventory_id: existingInventory.id, // Store the inventory ID
                purchase_amount: parseFloat(existingInventory.price),
                goods_service_name: item.goods_service_name || (goodsDetails?.goodsName || serviceDetails?.serviceName) || null,
                goods_service_description: item.goods_service_description || (goodsDetails?.description || serviceDetails?.description) || null,
                unit_price: unitPrice,
                quantity: quantity,
                amount: itemValues.amount,
                discount: itemValues.discountAmount,
                amount_after_discount: itemValues.amount_after_discount,
                gst_amount: itemValues.gst_amount,
                gst_percentage: String(item.gst_rate ?? ""),
                goods_service_total_amount: itemValues.goods_service_total_amount,
                created_by: user.id,
                created_on: new Date(),
                // Connect relations
                unit: {
                    connect: { id: parseInt(item.unit_of_measurement_id) }
                }
            };

            // Connect goods or service based on type
            if (item.sales_item_type === 'GOODS') {
                itemData.goods = {
                    connect: { goodsId: parseInt(item.goods_services_id) }
                };
                itemData.service = undefined;
            } else {
                itemData.service = {
                    connect: { service_id: parseInt(item.goods_services_id) }
                };
                itemData.goods = undefined;
            }

            return itemData;
        }));

        // Generate invoice number
        const invoice_no = (() => {
            const orgCode = code;
            const today = new Date();
            const yyyymmdd = today.getFullYear().toString()
                + String(today.getMonth() + 1).padStart(2, "0")
                + String(today.getDate()).padStart(2, "0");
            const random10Digit = Math.floor(1000000000 + Math.random() * 9000000000);
            return `${orgCode}/${yyyymmdd}${random10Digit}`;
        })();

        // Create sales with items and update inventory in transaction
        const sales = await prisma.$transaction(async (tx) => {
            // Create the second hand sale
            const sale = await tx.secondHandSale.create({
                data: {
                    organization_id: organizationId,
                    customer_id: parseInt(finalCustomerId),
                    currency: parseInt(currency),
                    customer_tpn: finalCustomerTpn || null,
                    customer_name: finalCustomerName || null,
                    sales_date: new Date(sales_date),
                    sales_amount,
                    exempt_amount,
                    taxable_amount,
                    gst_amount: taxable_amount > 0 ? taxable_amount * 0.05 : 0,
                    total_invoice_amount: exempt_amount + taxable_amount + (taxable_amount > 0 ? taxable_amount * 0.05 : 0),
                    sales_invoice_no: invoice_no,
                    status,
                    payment_mode: payment_mode || null,
                    transaction_id: transaction_id || null,
                    cheque_number: cheque_number || null,
                    journal_number: journal_number || null,
                    bank_name: bank_name || null,
                    created_by: user.id,
                    created_on: new Date(),
                    // Items
                    items: {
                        create: calculatedItems
                    }
                },
                include: {
                    items: true
                }
            });

            // Update inventory for all items - FIXED CALL
            console.log('Updating inventory for', inventoryUpdates.length, 'items');
            for (const inventoryUpdate of inventoryUpdates) {
                console.log('Processing inventory update for item:', inventoryUpdate.item.goods_service_name);
                await updateInventory(
                    tx,
                    inventoryUpdate.item,
                    organizationId,
                    user.id, // Pass user.id
                    false, // isUpdate = false for create
                    0 // oldQuantity = 0 for create
                );
            }

            return sale;
        }, {
            timeout: 10000 // Increase timeout if needed
        });

        console.log('Sale created successfully:', sales.second_hand_sales_id);

        return Response.json({
            success: true,
            message: "Second hand sales created successfully",
            data: {
                second_hand_sales_id: sales.second_hand_sales_id,
                sales_invoice_no: sales.sales_invoice_no,
                sales_amount: sales.sales_amount,
                sales_date: sales.sales_date,
                customer_id: finalCustomerId,
                customer_name: finalCustomerName,
                customer_tpn: finalCustomerTpn,
                payment_mode: sales.payment_mode,
                items: sales.items
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating second hand sales:", error);
        return Response.json({
            success: false,
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}