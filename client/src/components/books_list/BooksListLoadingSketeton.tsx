 /**
  * creates skeleton as loading indicator. Intended to use to replace book list items while fetching and list is empty
  */

export function BooksListLoadingSketeton() {

  const pulsingBgndClasses = " bg-[gray] opacity-20 rounded-[5px] animate-pulse "

  return (
    <div className="relative">
      {/*replace mass checking/unckecking checkbox, delete button*/}
      <div className="flex">
        <div className="flex items-center pr-[15px]">
          <div className={"w-[18px] h-[18px] " + pulsingBgndClasses}></div>
        </div>
        <div className={"h-[35px] w-[35px] rounded-full " + pulsingBgndClasses}></div>
      </div>
      {[...Array(5)].map((e, index) =>
        <div className="flex"
          key={index}>

          <div className="flex items-center pr-[15px]">
            {/*replace checkbox*/}
            <div className={"w-[18px] h-[18px] " + pulsingBgndClasses}></div>
          </div>

          <div className="grow shring basis-0 pt-[15px] pb-[16px] pr-[15px]">
            {/*book author and title replacement*/}
            <div className={"h-[11px] w-[100px] mb-[6px] " + pulsingBgndClasses}></div>
            <div className={"h-[18px] " + pulsingBgndClasses}></div>
          </div>

          <div className="grow-0 shrink-0 flex items-center gap-[10px] ml-[10px]">
            {/*edit, delete buttons replacement*/}
            <div className={"h-[35px] w-[35px] rounded-full " + pulsingBgndClasses}></div>
            <div className={"h-[35px] w-[35px] rounded-full " + pulsingBgndClasses}></div>
          </div>
        </div>)
      }
    </div>
  )
}
