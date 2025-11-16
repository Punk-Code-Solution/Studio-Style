const { Sale, Account } = require("../Database/models");
const bkrypt = require('bcrypt');

class SaleRepository{

  async findAllSaleLimit(limit = 10, base = 0){

    return await Sale.findAll({

      limit: limit,
      offset: base

    });

  }

  async findAllSale(){

    return await Sale.findAll();

  }

  async updateSale( sale ){   

    return await Sale.update({

      product_id: sale.product_id ? sale.product_id : Sale.product_id,
      name_product: sale.name_product ? sale.name_product : Sale.name_product,
      amount_product: sale.amount_product ? sale.amount_product : Sale.amount_product,
      price_total: sale.price_total ? sale.price_total : Sale.price_total,
      client_id: sale.client_id ? sale.client_id : Sale.client_id,
      account_id_sale: sale.account_id_sale ? sale.account_id_sale : Sale.account_id_sale,
      discount: sale.discount ? sale.discount : Sale.discount,
      date_sale: sale.date_sale ? sale.date_sale : Sale.date_sale,
      paid_off: sale.paid_off ? sale.paid_off : Sale.paid_off,
      remaining : sale.remaining ? sale.remaining : Saleremaining.remaining

    },
    {

      where: {        
        id: sale.id
      }

    });

  }

  async findSaleAccount( cpf ) {

    cpf = bkrypt.hashSync(cpf)

    const id = await Account.findOne({
      where:{
        cpf:cpf
      }
    })

    const sale = await Sale.findOne({

        where:{

          client_id:id
        
        }

    });
    return sale

  }

  async findSale( nameproduct ) {

    const sale = await Sale.findOne({

      where:{

        nameproduct

      },

    });

    return sale

  }
    
  async addSale(sale) {    
    
    const { 

      product_id,
      name_product,
      amount_product,
      price_total,
      client_id,
      account_id_sale,
      discount,
      date_sale,
      paid_off,
      remaining

    } = sale

    return await Sale.create({

      product_id,
      name_product,
      amount_product,
      price_total,
      client_id,
      account_id_sale,
      discount,
      date_sale,
      paid_off,
      remaining

    });
  }

}

module.exports = SaleRepository