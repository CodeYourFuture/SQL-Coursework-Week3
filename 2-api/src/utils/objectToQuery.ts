/* eslint-disable @typescript-eslint/no-explicit-any */
type Obj = {
  [key: string]: any;
};

export default function objectToQuery(obj: Obj): string {
  let query = '';
  Object.keys(obj).forEach((key) => {
    if (obj[key]) {
      query += `${key} = '${obj[key]}' `;
      query += ', ';
    }
  });
  return query.slice(0, -2);
}
