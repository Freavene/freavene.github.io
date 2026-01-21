// Simple meal planner prototype
const STORAGE_RECIPES = 'mealplanner_recipes_v1'
const STORAGE_PLAN = 'mealplanner_plan_v1'

const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

let recipes = []
let plan = [[],[],[],[],[],[],[]] // array per day, each entry is recipe id

function save(){
  localStorage.setItem(STORAGE_RECIPES, JSON.stringify(recipes))
  localStorage.setItem(STORAGE_PLAN, JSON.stringify(plan))
}

function load(){
  const r = localStorage.getItem(STORAGE_RECIPES)
  const p = localStorage.getItem(STORAGE_PLAN)
  if(r) recipes = JSON.parse(r)
  if(p) plan = JSON.parse(p)
}

function uid(){return Math.random().toString(36).slice(2,9)}

function renderRecipes(){
  const container = document.getElementById('recipes-list')
  container.innerHTML = ''
  const tpl = document.getElementById('recipe-template')
  recipes.forEach(rec=>{
    const el = tpl.content.cloneNode(true)
    el.querySelector('.recipe-title').textContent = rec.title
    el.querySelector('.recipe-ingredients').textContent = rec.ingredients.join('\n')
    const select = el.querySelector('.select-day')
    const addBtn = el.querySelector('.btn-add-to-day')
    const delBtn = el.querySelector('.btn-delete')
    addBtn.addEventListener('click',()=>{
      const day = parseInt(select.value,10)
      plan[day].push(rec.id)
      save()
      renderWeek()
      renderShopping()
    })
    delBtn.addEventListener('click',()=>{
      if(!confirm('Delete this recipe?')) return
      recipes = recipes.filter(r=>r.id!==rec.id)
      // remove from plan
      plan = plan.map(dayArr => dayArr.filter(id=>id!==rec.id))
      save();renderRecipes();renderWeek();renderShopping()
    })
    container.appendChild(el)
  })
}

function renderWeek(){
  const grid = document.getElementById('week-grid')
  grid.innerHTML = ''
  for(let d=0;d<7;d++){
    const dayBox = document.createElement('div')
    dayBox.className = 'day'
    const h = document.createElement('h4')
    h.textContent = days[d]
    dayBox.appendChild(h)
    plan[d].forEach(id=>{
      const rec = recipes.find(r=>r.id===id)
      if(!rec) return
      const meal = document.createElement('div')
      meal.className='meal'
      meal.textContent = rec.title
      // small delete button per meal
      const b = document.createElement('button')
      b.textContent='✕'
      b.title='Remove from day'
      b.style.marginLeft='8px'
      b.addEventListener('click',()=>{
        plan[d] = plan[d].filter(x=>x!==id)
        save();renderWeek();renderShopping()
      })
      meal.appendChild(b)
      dayBox.appendChild(meal)
    })
    grid.appendChild(dayBox)
  }
}

function renderShopping(){
  const el = document.getElementById('shopping-list')
  const items = {}
  plan.forEach(dayArr=>{
    dayArr.forEach(id=>{
      const rec = recipes.find(r=>r.id===id)
      if(!rec) return
      rec.ingredients.forEach(ing=>{
        const key = ing.trim().toLowerCase()
        if(!key) return
        items[key] = (items[key]||0)+1
      })
    })
  })
  el.innerHTML = ''
  const ul = document.createElement('ul')
  Object.keys(items).forEach(k=>{
    const li = document.createElement('li')
    li.textContent = k + (items[k]>1? ' ('+items[k]+')':'')
    ul.appendChild(li)
  })
  if(Object.keys(items).length===0) el.textContent = 'No items. Add meals to the week.'
  else el.appendChild(ul)
}

function promptNewRecipe(){
  const title = prompt('Recipe name')
  if(!title) return
  const raw = prompt('Enter ingredients, one per line (or comma separated)')
  if(raw===null) return
  const ingredients = raw.split(/\r?\n|,/).map(s=>s.trim()).filter(Boolean)
  const rec = {id: uid(), title, ingredients}
  recipes.push(rec)
  save();renderRecipes()
}

function exportJSON(){
  const data = {recipes,plan}
  const blob = new Blob([JSON.stringify(data, null, 2)],{type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'mealplanner-export.json'
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
}

function importJSONFile(file){
  const reader = new FileReader()
  reader.onload = () =>{
    try{
      const d = JSON.parse(reader.result)
      if(Array.isArray(d.recipes)) recipes = d.recipes
      if(Array.isArray(d.plan)) plan = d.plan
      save();renderRecipes();renderWeek();renderShopping()
    }catch(e){alert('Invalid file')}
  }
  reader.readAsText(file)
}

function clearAll(){
  if(!confirm('Clear all data from this device?')) return
  recipes = []
  plan = [[],[],[],[],[],[],[]]
  save();renderRecipes();renderWeek();renderShopping()
}

function wire(){
  document.getElementById('btn-new-recipe').addEventListener('click',promptNewRecipe)
  document.getElementById('btn-export').addEventListener('click',exportJSON)
  document.getElementById('btn-import').addEventListener('click',()=>document.getElementById('file-import').click())
  document.getElementById('file-import').addEventListener('change',e=>{
    const f = e.target.files[0]
    if(f) importJSONFile(f)
    e.target.value = ''
  })
  document.getElementById('btn-clear').addEventListener('click',clearAll)
  document.getElementById('btn-print').addEventListener('click',()=>window.print())
}

// init
load();wire();renderRecipes();renderWeek();renderShopping();