import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  

  

  const addProduct = async (productId: number) => {
    try {
      const updateCart=[...cart]
      const alreadyProduct = updateCart.find(prodc=> prodc.id === productId)

      const stock = await api.get(`/stock/${productId}`)

      const stockAmount = stock.data.amount
      
      const currentAmount = alreadyProduct ? alreadyProduct.amount : 0

      const amount = currentAmount+1

      if(amount>stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(alreadyProduct){
        alreadyProduct.amount=amount
      }else{
        const product = await api.get(`/products/${productId}`)
        const newProduct={
          ...product.data,
          amount
        }
        updateCart.push(newProduct)


      }

      setCart(()=>updateCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
     
    } catch {
        toast.error('Erro na adição do produto');
      
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updateCart= [...cart]
      

      const indexOf = updateCart.findIndex((product) => product.id === productId);

      if(indexOf>=0){
        updateCart.splice(indexOf,1)
        setCart(()=>updateCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
      }else{
        toast.error('Erro na remoção do produto');
        return
      }

      

      
      
    } catch {
        toast.error('Erro na remoção do produto');
      
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    

    try {
      if (amount<=0){
        return
      }

      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount
      if(stockAmount<amount) {
        return toast.error('Quantidade solicitada fora de estoque');
      }
      const updateCart=[...cart]

      const productExists = updateCart.find(product=>product.id === productId)

      if(productExists){
 
        productExists.amount=amount
        setCart(updateCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
 
  
        
      }
      else{
        throw Error
      }

      
        
      

      

      
       
    } catch {
       return toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
