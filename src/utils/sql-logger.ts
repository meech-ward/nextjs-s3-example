export async function prettyPrintSQL(sql: string, params: unknown[]) {
  console.log("send post request")
  try {
    const result = await fetch("http://127.0.0.1:4000", {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    })
    console.log(await result.text())
  } catch (e) {
    console.log(e)
  }
  console.log("sent post request")
}

// Example usage
// console.log(prettyPrintSQL('select * from users where id = 1;'));
