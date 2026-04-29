 /**
  * creates skeleton as loading indicator. Intended to use to replace book list items while fetching and list is empty
  */

export function BookFormSketeton() {

  const pulsingBgndClasses = " bg-[gray] opacity-20 rounded-[5px] animate-pulse "

  return (
    <div className="max-w-[700px] pb-[45px]">

      {/*five label, input field pairs*/}
      {[...Array(5)].map((e, index) =>
        <div key={index}>

          {/*field label*/}
          <div className={"w-[85px] h-[23px] mb-[5px] " + pulsingBgndClasses}></div>

          {/*input field. Width is container width*/}
          <div className={"h-[35px] mb-[25px] " + pulsingBgndClasses}></div>
        </div>)
      }

      {/*submit button*/}
      <div className={"w-[120px] h-[43px] mb-[15px] " + pulsingBgndClasses}></div>
    </div>
  )
}
