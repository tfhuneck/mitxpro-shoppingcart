// simulate getting products from DataBase
const products = [
  { name: "Apples_", country: "Italy", cost: 3, instock: 10 },
  { name: "Oranges", country: "Spain", cost: 4, instock: 3 },
  { name: "Beans__", country: "USA", cost: 2, instock: 5 },
  { name: "Cabbage", country: "USA", cost: 1, instock: 8 },
];

//=========Cart=============
const Cart = (props) => {
  const { Card, Accordion, Button } = ReactBootstrap;
  let data = props.location.data ? props.location.data : products;
  console.log(`data:${JSON.stringify(data)}`);
  return <Accordion defaultActiveKey="0">{list}</Accordion>;
};

//===========API Call============
const useDataApi = (initialUrl, initialData) => {
  const { useState, useEffect, useReducer } = React;
  const [url, setUrl] = useState(initialUrl);
  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });
  console.log(`useDataApi called`);
  useEffect(() => {
    console.log("useEffect Called");
    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios(url);
        console.log("FETCH FROM URl");
        if (!didCancel) {
          // result.data.data
          // first data is from axios object, second data is from strapi object
          dispatch({ type: "FETCH_SUCCESS", payload: result.data.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]);
  return [state, setUrl];
};

const dataFetchReducer = (state, action) => { 
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

// ============Main Component=========
const Products = (props) => {
  const [items, setItems] = React.useState(products);
  const [cart, setCart] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const {
    Card,
    Accordion,
    Button,
    Container,
    Row,
    Col,
    Image,
    Input,
  } = ReactBootstrap;
  //  Fetch Data
  const { Fragment, useState, useEffect, useReducer } = React;
  const [query, setQuery] = useState("http://localhost:1337/api/products");
  const [{ data, isLoading, isError }, doFetch] = useDataApi(
    "http://localhost:1337/api/products",
    {
      data: [],
    }
  );
  console.log(`Rendering Products ${JSON.stringify(data)}`);

  //===========Adding to Cart=========
  const addToCart = (e) => {
    e.preventDefault();
    let name = e.target.name;
    let item = items.filter((item) => item.name == name);
    item[0].instock = item[0].instock - 1;
    console.log('the stock of', name, item[0].instock);
    setItems([...items]);
    console.log(`CURRENT TOTAL STOCK IS ${JSON.stringify(items)}`);
    setCart([...cart, ...item,]);
    //doFetch(query);
  };

  //===========Deleting and Restocking from Cart=============  
  const deleteCartItem = (indexCart) => {
    let newCart = cart.filter((item, i) => indexCart != i);
    let restockItem = cart.filter((item, index) => indexCart == index);
    let restock = items.map((item, index) => {
      if (item.name == restockItem[0].name) item.instock = item.instock + 1;
      return item;
    });
    console.log('This item will be restocked', restockItem);
    setCart(newCart);
    console.log(`CURRENT TOTAL STOCK IS ${JSON.stringify(items)}`);
    setItems(restock);
  }

  //===========Pictures==========
  const photos = ["apple.png", "orange.png", "beans.png", "cabbage.png"];
  let list = items.map((item, index) => {
    let n = index + 1049;
    let url = "https://picsum.photos/id/" + n + "/50/50";

    return (
      <li key={index}>
        <Image src={url} width={70} roundedCircle></Image>
        <Button className="btn btn-warning" variant="primary" size="large">
          {item.name} ${item.cost} -- stock:{item.instock}
        </Button>
        <input className="btn btn-outline-secondary" name={item.name} type="submit" disabled={item.instock === 0} onClick={addToCart}></input>
      </li>
    );
  });
  let cartList = cart.map((item, index) => {
    return (
      <Accordion.Item key={1+index} eventKey={1 + index}>
      <Accordion.Header >
        {item.name}
      </Accordion.Header>
      <Accordion.Body  onClick={() => deleteCartItem(index)}
        eventKey={1 + index}>
        $ {item.cost} from {item.country}
      </Accordion.Body>
    </Accordion.Item>
    );
  });

  let finalList = () => {
    let total = checkOut();
    let final = cart.map((item, index) => {
      return (
        <div key={index} index={index}>
          {item.name}
        </div>
      );
    });
    return { final, total };
  };

  const checkOut = () => {
    let costs = cart.map((item) => item.cost);
    const reducer = (accum, current) => accum + current;
    let newTotal = costs.reduce(reducer, 0);
    console.log(`total updated to ${newTotal}`);
    return newTotal;
  };

  const clearCart = clear => {
    let emptyCart = [];
    setCart(emptyCart);
  }
  
  // TODO: implement the restockProducts function
  const restockProducts = (url) => {
    doFetch(url);
    let addItems = data.map((item) => {
      let { attributes: {name}, attributes: {country}, attributes: {cost}, attributes: {instock} } = item;
      return { name, country, cost, instock };
    });
    console.log('Restock Items are:', data, addItems);
    setItems([...items, ...addItems]);
  };

  return (
    <Container>
      <Row>
        <Col>
          <h1>Product List</h1>
          <ul style={{ listStyleType: "none" }}>{list}</ul>
        </Col>
        <Col>
          <h1>Cart Contents</h1>
          <Accordion defaultActiveKey="0">{cartList}</Accordion>
        </Col>
        <Col>
          <h1>CheckOut</h1>
          <Card onChange={checkOut}>CheckOut
          <Card.Header>
            $ {finalList().total}
          </Card.Header>
          <Card.Body>
          <div> {finalList().total > 0 && finalList().final} </div>
          </Card.Body>
          </Card>
          <Button onClick={clearCart} className="btn btn-danger">Checkout</Button>
        </Col>
      </Row>
      <Row>
        <form 
          onSubmit={(event) => {
            restockProducts({query});
            console.log(`Restock called on ${query}`);
            event.preventDefault();
          }}
        >
          <div className="row">
            <div className="col-sm-3">
              <input
                className="form-control"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button className="btn btn-outline-secondary" type="submit">ReStock Products</button>
            </div>
          </div>
        </form>
      </Row>
    </Container>
  );
};
// ========================================
ReactDOM.render(<Products />, document.getElementById("root"));

